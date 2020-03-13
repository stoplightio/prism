import {
  createInstance,
  IHttpNameValue,
  IHttpNameValues,
  ProblemJsonError,
  VIOLATIONS,
  IHttpConfig,
} from '@stoplight/prism-http';
import { DiagnosticSeverity, HttpMethod, IHttpOperation, Dictionary } from '@stoplight/types';
import { IncomingMessage, ServerResponse, IncomingHttpHeaders } from 'http';
import { AddressInfo } from 'net';
import { IPrismHttpServer, IPrismHttpServerOpts } from './types';
import { IPrismDiagnostic } from '@stoplight/prism-core';
import { MicriHandler } from 'micri';
import micri, { Router, json, send, text } from 'micri';
import * as typeIs from 'type-is';
import { getHttpConfigFromRequest } from './getHttpConfigFromRequest';
import { serialize } from './serialize';
import { merge } from 'lodash';
import { pipe } from 'fp-ts/lib/pipeable';
import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';

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

    const mockConfig: TE.TaskEither<Error, IHttpConfig['mock']> =
      opts.config.mock === false
        ? TE.right(false)
        : pipe(
            getHttpConfigFromRequest(input),
            E.map(operationSpecificConfig => merge(opts.config.mock, operationSpecificConfig)),
            TE.fromEither
          );

    pipe(
      mockConfig,
      TE.chain(mockConfig => prism.request(input, operations, { ...opts.config, mock: mockConfig })),
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

  function setCommonCORSHeaders(incomingHeaders: IncomingHttpHeaders, res: ServerResponse) {
    res.setHeader('Access-Control-Allow-Origin', incomingHeaders['origin'] || '*');
    res.setHeader('Access-Control-Allow-Headers', incomingHeaders['access-control-request-headers'] || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Expose-Headers', incomingHeaders['access-control-expose-headers'] || '*');
  }

  const server = micri(
    Router.router(
      Router.on.options(
        () => opts.cors,
        (req: IncomingMessage, res: ServerResponse) => {
          setCommonCORSHeaders(req.headers, res);

          if (!!req.headers['origin'] && !!req.headers['access-control-request-method']) {
            // This is a preflight request, so we'll respond with the appropriate CORS response
            res.setHeader(
              'Access-Control-Allow-Methods',
              req.headers['access-control-request-method'] || 'GET,DELETE,HEAD,PATCH,POST,PUT,OPTIONS'
            );

            res.setHeader('Vary', 'origin');

            // This should not be required since we're responding with a 204, which has no content by definition. However
            // Safari does not really understand that and throws a Network Error. Explicit is better than implicit.
            res.setHeader('Content-Length', '0');
            return send(res, 204);
          }

          return handler(req, res);
        }
      ),
      Router.otherwise((req, res, options) => {
        if (opts.cors) setCommonCORSHeaders(req.headers, res);

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
