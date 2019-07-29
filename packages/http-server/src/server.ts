import { configMergerFactory, createLogger } from '@stoplight/prism-core';
import { createInstance, IHttpMethod, ProblemJsonError, TPrismHttpInstance } from '@stoplight/prism-http';
import { IHttpOperation } from '@stoplight/types';
import * as fastify from 'fastify';
// @ts-ignore
import * as fastifyAcceptsSerializer from 'fastify-accepts-serializer';
import * as formbodyParser from 'fastify-formbody';
import { IncomingMessage, ServerResponse } from 'http';
import * as typeIs from 'type-is';
import { getHttpConfigFromRequest } from './getHttpConfigFromRequest';
import serializers from './serializers';
import { IPrismHttpServer, IPrismHttpServerOpts } from './types';

export const createServer = (operations: IHttpOperation[], opts: IPrismHttpServerOpts): IPrismHttpServer => {
  const { components, config } = opts;

  const server = fastify({
    logger: (components && components.logger) || createLogger('HTTP SERVER'),
    disableRequestLogging: true,
    modifyCoreObjects: false,
  })
    .register(formbodyParser)
    .register(fastifyAcceptsSerializer, { serializers });

  server.addContentTypeParser('*', { parseAs: 'string' }, (req, body, done) => {
    if (typeIs(req, ['application/*+json'])) {
      try {
        return done(null, JSON.parse(body));
      } catch (e) {
        return done(e);
      }
    }
    const error: Error & { status?: number } = new Error(`Unsupported media type.`);
    error.status = 415;
    Error.captureStackTrace(error);
    return done(error);
  });

  const mergedConfig = configMergerFactory({ mock: { dynamic: false } }, config, getHttpConfigFromRequest);

  const prism = createInstance(mergedConfig, components);

  server.all('*', {}, replyHandler(prism));

  const prismServer: IPrismHttpServer = {
    get prism() {
      return prism;
    },

    get fastify() {
      return server;
    },

    listen: (port: number, ...args: any[]) => server.listen(port, ...args),
  };

  function replyHandler(prismInstance: TPrismHttpInstance): fastify.RequestHandler<IncomingMessage, ServerResponse> {
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
        const response = await prismInstance.process(input, operations);

        const { output } = response;

        if (output) {
          reply.code(output.statusCode);

          if (output.headers) {
            reply.headers(output.headers);
          }
          reply.send(output.body);
        } else {
          throw new Error('Unable to find any decent response for the current request.');
        }
      } catch (e) {
        if (!reply.sent) {
          const status = 'status' in e ? e.status : 500;
          reply
            .type('application/problem+json')
            .serializer(JSON.stringify)
            .code(status)
            .send(ProblemJsonError.fromPlainError(e));
        } else {
          reply.res.end();
        }

        request.log.error({ input, offset: 1 }, `Request terminated with error: ${e}`);
      }
    };
  }

  return prismServer;
};
