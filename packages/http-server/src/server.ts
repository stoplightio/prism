import { createInstance, IHttpNameValue, IHttpNameValues, ProblemJsonError, VIOLATIONS } from '@stoplight/prism-http';
import { DiagnosticSeverity, HttpMethod, IHttpOperation, Dictionary } from '@stoplight/types';
import { IncomingMessage, ServerResponse } from 'http';
import { AddressInfo } from 'net';
import micri, { Router, json, send, text } from 'micri';
import * as typeIs from 'type-is';
import { getHttpConfigFromRequest } from './getHttpConfigFromRequest';
import { serialize } from './serialize';
import { IPrismHttpServer, IPrismHttpServerOpts } from './types';
import { IPrismDiagnostic } from '@stoplight/prism-core';
import { pipe } from 'fp-ts/lib/pipeable';
import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';
import { MicriHandler } from 'micri';

function searchParamsToNameValues(searchParams: URLSearchParams): IHttpNameValues {
  const params = {};
  for (const key of searchParams.keys()) {
    const values = searchParams.getAll(key);
    params[key] = values.length === 1 ? values[0] : values;
  }
  return params;
}

function addressInfoToString(address: AddressInfo | string | null) {
  if (!address) return '';
  const a = address as AddressInfo;
  return `http://${a.address}:${a.port}`;
}

function parseRequestBody(request: IncomingMessage) {
  // if no body provided then return null instead of empty string
  if (
    request.headers['content-type'] === undefined &&
    request.headers['transfer-encoding'] === undefined &&
    (request.headers['content-length'] === '0' || request.headers['content-length'] === undefined)
  ) {
    return Promise.resolve(null);
  }

  if (typeIs(request, ['application/json', 'application/*+json'])) {
    return json(request);
  } else {
    return text(request);
  }
}

export const createServer = (operations: IHttpOperation[], opts: IPrismHttpServerOpts): IPrismHttpServer => {
  const { components, config } = opts;

  const handler: MicriHandler = async (request, reply) => {
    const { url, method, headers } = request;

    const body = await parseRequestBody(request);

    const { searchParams, pathname } = new URL(
      url!, // url can't be empty for HTTP request
      'http://example.com' // needed because URL can't handle relative URLs
    );

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

    components.logger.info({ input }, 'Request received');

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

          if (opts.config.errors && errorViolations.length > 0) {
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
            components.logger.error({ name: 'VALIDATOR' }, message);
          } else if (validation.severity === DiagnosticSeverity[DiagnosticSeverity.Warning]) {
            components.logger.warn({ name: 'VALIDATOR' }, message);
          } else {
            components.logger.info({ name: 'VALIDATOR' }, message);
          }
        });

        return TE.fromIOEither(() =>
          E.tryCatch(() => {
            if (output.headers) Object.entries(output.headers).forEach(([name, value]) => reply.setHeader(name, value));

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

          send(reply, e.status || 500, JSON.stringify(ProblemJsonError.fromPlainError(e)));
        } else {
          reply.end();
        }

        components.logger.error({ input }, `Request terminated with error: ${e}`);
      })
    )();
  };

  const server = micri(
    Router.router(
      Router.on.options(
        () => opts.cors,
        (req: IncomingMessage, res: ServerResponse) => {
          res.setHeader('Access-Control-Allow-Origin', req.headers['origin'] || '*');
          res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || '*');
          res.setHeader('Access-Control-Allow-Credentials', 'true');
          res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,HEAD,PATCH,POST,PUT');
          res.setHeader('Access-Control-Expose-Headers', req.headers['access-control-expose-headers'] || '*');
          res.setHeader('Vary', 'origin');
          res.setHeader('Content-Length', '0');
          send(res, 204);
        }
      ),
      Router.otherwise((req, res, options) => {
        if (opts.cors) {
          res.setHeader('Access-Control-Allow-Origin', req.headers['origin'] || '*');
          res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || '*');
          res.setHeader('Access-Control-Allow-Credentials', 'true');
          res.setHeader('Access-Control-Expose-Headers', req.headers['access-control-expose-headers'] || '*');
        }
        return handler(req, res, options);
      })
    )
  );

  const prism = createInstance(config, components);

  return {
    get prism() {
      return prism;
    },

    get logger() {
      return components.logger;
    },

    close() {
      return new Promise((resolve, reject) =>
        server.close(error => {
          if (error) {
            reject(error);
          }

          resolve();
        })
      );
    },

    listen: (port: number, ...args: any[]) =>
      new Promise(resolve => server.listen(port, ...args, () => resolve(addressInfoToString(server.address())))),
  };
};

const createErrorObjectWithPrefix = (locationPrefix: string) => (detail: IPrismDiagnostic) => ({
  location: [locationPrefix].concat(detail.path || []),
  severity: DiagnosticSeverity[detail.severity],
  code: detail.code,
  message: detail.message,
});
