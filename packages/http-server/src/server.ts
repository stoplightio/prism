import { createLogger } from '@stoplight/prism-core';
import { createInstance, ProblemJsonError } from '@stoplight/prism-http';
import { DiagnosticSeverity, HttpMethod, IHttpOperation } from '@stoplight/types';
import * as fastify from 'fastify';
import * as fastifyCors from 'fastify-cors';
import { IncomingMessage, ServerResponse } from 'http';
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

  const prism = createInstance(config, components);

  const replyHandler: fastify.RequestHandler<IncomingMessage, ServerResponse> = async (request, reply) => {
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
    try {
      const operationSpecificConfig = getHttpConfigFromRequest(input);
      const mockConfig = opts.config.mock === false ? false : { ...opts.config.mock, ...operationSpecificConfig };

      const response = await prism.request(input, operations, {
        ...opts.config,
        mock: mockConfig,
      });

      const { output } = response;

      reply.code(output.statusCode);

      if (output.headers) {
        reply.headers(output.headers);
      }

      response.validations.output.forEach(validation => {
        if (validation.severity === DiagnosticSeverity.Error) {
          request.log.error(`${validation.path} — ${validation.message}`);
        } else if (validation.severity === DiagnosticSeverity.Warning) {
          request.log.warn(`${validation.path} — ${validation.message}`);
        } else {
          request.log.info(`${validation.path} — ${validation.message}`);
        }
      });

      reply.serializer((payload: unknown) => serialize(payload, reply.getHeader('content-type'))).send(output.body);
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
