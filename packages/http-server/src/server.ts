import { createInstance, IHttpNameValue, IHttpNameValues, ProblemJsonError, VIOLATIONS } from '@stoplight/prism-http';
import { DiagnosticSeverity, HttpMethod, IHttpOperation, Dictionary } from '@stoplight/types';
import { IncomingMessage, ServerResponse, IncomingHttpHeaders, Server } from 'http';
import * as fastifyCors from 'fastify-cors';
import micri, { send, text } from 'micri';
import * as typeIs from 'type-is';
import { getHttpConfigFromRequest } from './getHttpConfigFromRequest';
import { serialize } from './serialize';
import { IPrismHttpServer, IPrismHttpServerOpts } from './types';
import { IPrismDiagnostic } from '@stoplight/prism-core';
import { pipe } from 'fp-ts/lib/pipeable';
import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';
import { MicriHandler } from 'micri/dist';

function searchParamsToNameValues(searchParams: URLSearchParams): IHttpNameValues {
  const params = {};
  for (const key of searchParams.keys()) {
    const values = searchParams.getAll(key);
    params[key] = values.length === 1 ? values[0] : values;
  }
  return params;
}

export const createServer = (operations: IHttpOperation[], opts: IPrismHttpServerOpts): IPrismHttpServer => {
  const { components, config } = opts;

  const micriHandler: MicriHandler = async (request: IncomingMessage, reply: ServerResponse) => {
    const {
      url,
      method,
      headers,
    } = request;

    if (!url) {
      return TE.left(new Error('Missing URL in request!'));
    }

    // @todo deserialize if json
    const body = await text(request);

    const { searchParams, pathname } = new URL(url);

    const input = {
      method: (method ? method.toLowerCase() : 'get') as HttpMethod,
      url: {
        path: pathname,
        baseUrl: searchParams.get('__server') || undefined,
        query: searchParamsToNameValues(searchParams),
      },
      headers: headers as IHttpNameValue,
      body,
    };

    // @todo handle logging
    console.log({ input }, 'Request received');

    const operationSpecificConfig = getHttpConfigFromRequest(input);
    const mockConfig = opts.config.mock === false ? false : { ...opts.config.mock, ...operationSpecificConfig };

    pipe(
      prism.request(input, operations, { ...opts.config, mock: mockConfig }),
      TE.chain(response => {
        const { output } = response;

        const inputValidationErrors = response.validations.input.map(createErrorObjectWithPrefix('request'));
        const outputValidationErrors = response.validations.output.map(createErrorObjectWithPrefix('response'));
        const inputOutputValidationErrors = inputValidationErrors.concat(outputValidationErrors);

        if (inputOutputValidationErrors.length > 0) {
          reply.setHeader('sl-violations', JSON.stringify(inputOutputValidationErrors));

          const errorViolations = outputValidationErrors.filter(
            v => v.severity === DiagnosticSeverity[DiagnosticSeverity.Error]
          );

          if (opts.errors && errorViolations.length > 0) {
            return TE.left(
              ProblemJsonError.fromTemplate(
                VIOLATIONS,
                'Your request/response is not valid and the --errors flag is set, so Prism is generating this error for you.',
                { validation: errorViolations }
              )
            );
          }
        }

        inputOutputValidationErrors.forEach(validation => {
          const message = `Violation: ${validation.location.join('.') || ''} ${validation.message}`;
          if (validation.severity === DiagnosticSeverity[DiagnosticSeverity.Error]) {
            // request.log.error({ name: 'VALIDATOR' }, message);
            console.log({ name: 'VALIDATOR' }, message);
          } else if (validation.severity === DiagnosticSeverity[DiagnosticSeverity.Warning]) {
            // request.log.warn({ name: 'VALIDATOR' }, message);
            console.log({ name: 'VALIDATOR' }, message);
          } else {
            // request.log.info({ name: 'VALIDATOR' }, message);
            console.log({ name: 'VALIDATOR' }, message);
          }
        });

        return TE.fromIOEither(() =>
          E.tryCatch(() => {
            if (output.headers)
              Object.entries(output.headers).forEach(([name, value]) => reply.setHeader(name, value));

            send(
              reply,
              output.statusCode,
              serialize(output.body, reply.getHeader('content-type') as string | undefined)
            );
          }, E.toError)
        );
      }),
      TE.mapLeft((e: Error & { status?: number; additional?: { headers?: Dictionary<string> } }) => {
        if (!reply.finished) {
          reply.setHeader('content-type', 'application/problem+json');

          if (e.additional && e.additional.headers)
            Object.entries(e.additional.headers).forEach(([name, value]) => reply.setHeader(name, value));

          send(
            reply,
            e.status || 500,
            JSON.stringify(ProblemJsonError.fromPlainError(e))
          );
        } else {
          reply.end();
        }

        // request.log.error({ input }, `Request terminated with error: ${e}`);
        console.log({ input }, `Request terminated with error: ${e}`);
      })
    )();
  };

  const server = micri(micriHandler);

  if (opts.cors) server.register(fastifyCors, { origin: true, credentials: true });

  server.addContentTypeParser('*', { parseAs: 'string' }, (req, body, done) => {
    if (typeIs(req, ['application/*+json'])) {
      try {
        return done(null, JSON.parse(body));
      } catch (e) {
        return done(e);
      }
    }

    if (typeIs(req, ['application/x-www-form-urlencoded'])) {
      return done(null, body);
    }

    const error: Error & { status?: number } = new Error(`Unsupported media type.`);
    error.status = 415;
    Error.captureStackTrace(error);
    return done(error);
  });

  const prism = createInstance(config, components);

/*  opts.cors
    ? server.route({
        url: '*',
        method: ['GET', 'DELETE', 'HEAD', 'PATCH', 'POST', 'PUT'],
        handler: replyHandler,
      })
    : server.all('*', replyHandler);*/

  return {
    get prism() {
      return prism;
    },

    get server() {
      return server;
    },

    listen: (port: number, ...args: any[]) => new Promise(resolve => server.listen(port, ...args, resolve)),
  };
};

const createErrorObjectWithPrefix = (locationPrefix: string) => (detail: IPrismDiagnostic) => ({
  location: [locationPrefix].concat(detail.path || []),
  severity: DiagnosticSeverity[detail.severity],
  code: detail.code,
  message: detail.message,
});
