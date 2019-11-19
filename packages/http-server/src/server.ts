import { createInstance, ProblemJsonError, VIOLATIONS } from '@stoplight/prism-http';
import { DiagnosticSeverity, HttpMethod, IHttpOperation, Dictionary } from '@stoplight/types';
import * as fastify from 'fastify';
import * as fastifyCors from 'fastify-cors';
import * as typeIs from 'type-is';
import { getHttpConfigFromRequest } from './getHttpConfigFromRequest';
import { serialize } from './serialize';
import { IPrismHttpServer, IPrismHttpServerOpts } from './types';
import { IPrismDiagnostic } from '@stoplight/prism-core';
import { pipe } from 'fp-ts/lib/pipeable';
import * as TaskEither from 'fp-ts/lib/TaskEither';
import * as Either from 'fp-ts/lib/Either';

export const createServer = (operations: IHttpOperation[], opts: IPrismHttpServerOpts): IPrismHttpServer => {
  const { components, config } = opts;

  const server = fastify({
    logger: components.logger,
    disableRequestLogging: true,
    modifyCoreObjects: false,
  });

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

  const replyHandler: fastify.RequestHandler = (request, reply) => {
    const {
      req: { method, url },
      body,
      headers,
      query,
    } = request;

    const input = {
      method: (method ? method.toLowerCase() : 'get') as HttpMethod,
      url: {
        path: (url || '/').split('?')[0],
        query,
        baseUrl: query.__server,
      },
      headers,
      body,
    };

    request.log.info({ input }, 'Request received');

    const operationSpecificConfig = getHttpConfigFromRequest(input);
    const mockConfig = opts.config.mock === false ? false : { ...opts.config.mock, ...operationSpecificConfig };
    // Do not return, or Fastify will try to send the response again.
    pipe(
      prism.request(input, operations, { ...opts.config, mock: mockConfig }),
      TaskEither.chain(response => {
        const { output } = response;

        const inputOutputValidationErrors = response.validations.output
          .map(createErrorObjectWithPrefix('response'))
          .concat(response.validations.input.map(createErrorObjectWithPrefix('request')));

        if (inputOutputValidationErrors.length > 0) {
          reply.header('sl-violations', JSON.stringify(inputOutputValidationErrors));

          const errorViolations = inputOutputValidationErrors.filter(
            v => v.severity === DiagnosticSeverity[DiagnosticSeverity.Error]
          );
          if (opts.errors && errorViolations.length > 0) {
            return TaskEither.left(
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
            request.log.error({ name: 'VALIDATOR' }, message);
          } else if (validation.severity === DiagnosticSeverity[DiagnosticSeverity.Warning]) {
            request.log.warn({ name: 'VALIDATOR' }, message);
          } else {
            request.log.info({ name: 'VALIDATOR' }, message);
          }
        });

        return TaskEither.fromIOEither(() =>
          Either.tryCatch(() => {
            if (output.headers) reply.headers(output.headers);

            reply
              .code(output.statusCode)
              .serializer((payload: unknown) => serialize(payload, reply.getHeader('content-type')))
              .send(output.body);
          }, Either.toError)
        );
      }),
      TaskEither.mapLeft((e: Error & { status?: number; additional?: { headers?: Dictionary<string> } }) => {
        if (!reply.sent) {
          const status = e.status || 500;
          reply
            .type('application/problem+json')
            .serializer(JSON.stringify)
            .code(status);

          if (e.additional && e.additional.headers) {
            reply.headers(e.additional.headers);
          }

          reply.send(ProblemJsonError.fromPlainError(e));
        } else {
          reply.res.end();
        }

        request.log.error({ input }, `Request terminated with error: ${e}`);
      })
    )();
  };

  opts.cors
    ? server.route({
        url: '*',
        method: ['GET', 'DELETE', 'HEAD', 'PATCH', 'POST', 'PUT'],
        handler: replyHandler,
      })
    : server.all('*', replyHandler);

  const prismServer: IPrismHttpServer = {
    get prism() {
      return prism;
    },

    get fastify() {
      return server;
    },

    listen: (port: number, ...args: any[]) => server.listen(port, ...args),
  };
  return prismServer;
};

const createErrorObjectWithPrefix = (locationPrefix: string) => (detail: IPrismDiagnostic) => ({
  location: [locationPrefix].concat(detail.path || []),
  severity: DiagnosticSeverity[detail.severity],
  code: detail.code,
  message: detail.message,
});
