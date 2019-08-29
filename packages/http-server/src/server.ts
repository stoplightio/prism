import { configMergerFactory, createLogger } from '@stoplight/prism-core';
import { createInstance, IHttpMethod, ProblemJsonError, TPrismHttpInstance } from '@stoplight/prism-http';
import { IHttpOperation } from '@stoplight/types';
import { Dictionary } from '@stoplight/types';
import * as fastify from 'fastify';
// @ts-ignore
import * as fastifyCors from 'fastify-cors';
import * as formbodyParser from 'fastify-formbody';
import { IncomingMessage, ServerResponse } from 'http';
import * as typeIs from 'type-is';
import { getHttpConfigFromRequest } from './getHttpConfigFromRequest';
import serializers from './serializers';
import { IPrismHttpServer, IPrismHttpServerOpts } from './types';

import { FastifyReply } from 'fastify';

type Serializer = {
  test: (x: string) => boolean;
  serializer: (a: string | object) => string;
};

function optionallySerializeAndSend(
  reply: FastifyReply<ServerResponse>,
  output: { headers?: Dictionary<string, string>; body?: string | object },
  respSerializers: Serializer[],
) {
  const contentType = output.headers && output.headers['Content-type'];
  const serializer = respSerializers.find((s: Serializer) => s.test(contentType || ''));

  const data = serializer && output.body ? serializer.serializer(output.body) : output.body;

  if (serializer) {
    reply.serializer(serializer.serializer);
  }

  // TODO: do we need charset=utf-8 at all ???
  if (output && output.headers && output.headers['Content-type'].includes('application/json')) {
    // why would only application/json have the charset?
    reply.header('content-type', output.headers['Content-type'] + '; charset=utf-8');
  }

  reply.send(data);
}

export const createServer = (operations: IHttpOperation[], opts: IPrismHttpServerOpts): IPrismHttpServer => {
  const { components, config } = opts;

  const server = fastify({
    logger: (components && components.logger) || createLogger('HTTP SERVER'),
    disableRequestLogging: true,
    modifyCoreObjects: false,
  }).register(formbodyParser);

  if (opts.config.cors) server.register(fastifyCors);

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

  const mergedConfig = configMergerFactory(
    { cors: false, mock: { dynamic: false }, validateRequest: true, validateResponse: true },
    config,
    getHttpConfigFromRequest,
  );

  const prism = createInstance(mergedConfig, components);

  opts.config.cors
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

          optionallySerializeAndSend(reply, output, serializers);
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
