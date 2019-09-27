import { createLogger } from '@stoplight/prism-core';
import { createInstance, IHttpConfig, IHttpMethod, PrismHttpInstance, ProblemJsonError } from '@stoplight/prism-http';
import { DiagnosticSeverity, IHttpOperation } from '@stoplight/types';
import * as fastify from 'fastify';
import * as fastifyCors from 'fastify-cors';
import { IncomingMessage, ServerResponse } from 'http';
import { defaults } from 'lodash';
import * as typeIs from 'type-is';
import { getHttpConfigFromRequest } from './getHttpConfigFromRequest';
import { serialize } from './serialize';
import { IPrismHttpServer, IPrismHttpServerOpts } from './types';

export const createServer = (operations: IHttpOperation[], opts: IPrismHttpServerOpts): IPrismHttpServer => {
  const { components, config } = opts;

  const server = fastify({
    logger: (components && components.logger) || createLogger('HTTP SERVER'),
    disableRequestLogging: true,
    modifyCoreObjects: false,
  });

  if (opts.cors) server.register(fastifyCors);

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

  const mergedConfig = defaults<Partial<IHttpConfig>, IHttpConfig>(config, {
    mock: { dynamic: false },
    validateRequest: true,
    validateResponse: true,
    checkSecurity: true,
  });

  const prism = createInstance(mergedConfig, components);

  opts.cors
    ? server.route({
        url: '*',
        method: ['GET', 'DELETE', 'HEAD', 'PATCH', 'POST', 'PUT'],
        handler: replyHandler(prism),
      })
    : server.all('*', replyHandler(prism));

  const prismServer: IPrismHttpServer = {
    get prism() {
      return prism;
    },

    get fastify() {
      return server;
    },

    listen: (port: number, ...args: any[]) => server.listen(port, ...args),
  };

  function replyHandler(prismInstance: PrismHttpInstance): fastify.RequestHandler<IncomingMessage, ServerResponse> {
    return async (request, reply) => {
      const {
        req: { method, url },
        body,
        headers,
        query,
      } = request;

      const input = {
        method: (method ? method.toLowerCase() : 'get') as IHttpMethod,
        url: {
          path: (url || '/').split('?')[0],
          query,
          baseUrl: query.__server,
        },
        headers,
        body,
      };

      request.log.info({ input }, 'Request received');
      try {
        const operationSpecificConfig = getHttpConfigFromRequest(input);
        const mockConfig = Object.assign({}, opts.config.mock, operationSpecificConfig);

        const response = await prismInstance.request(input, operations, {
          ...opts.config,
          mock: mockConfig,
        });

        const { output } = response;

        if (output) {
          reply.code(output.statusCode);

          if (output.headers) {
            reply.headers(output.headers);
          }

          response.validations.output.forEach(validation => {
            if (validation.severity === DiagnosticSeverity.Error) {
              request.log.error(validation.message);
            } else if (validation.severity === DiagnosticSeverity.Warning) {
              request.log.warn(validation.message);
            } else {
              request.log.info(validation.message);
            }
          });

          reply.serializer((payload: unknown) => serialize(payload, reply.getHeader('content-type'))).send(output.body);
        } else {
          throw new Error('Unable to find any decent response for the current request.');
        }
      } catch (e) {
        if (!reply.sent) {
          const status = 'status' in e ? e.status : 500;
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

        request.log.error({ input, offset: 1 }, `Request terminated with error: ${e}`);
      }
    };
  }

  return prismServer;
};
