import { configMergerFactory } from '@stoplight/prism-core';
import { createInstance, IHttpMethod, TPrismHttpInstance } from '@stoplight/prism-http';
import * as fastify from 'fastify';
import { IncomingMessage, Server, ServerResponse } from 'http';

import { getHttpConfigFromRequest } from './getHttpConfigFromRequest';
import { IPrismHttpServer, IPrismHttpServerOpts } from './types';

export const createServer = <LoaderInput>(
  loaderInput: LoaderInput,
  opts: IPrismHttpServerOpts<LoaderInput>
): IPrismHttpServer<LoaderInput> => {
  const server = fastify<Server, IncomingMessage, ServerResponse>();
  const { components = {}, config } = opts;
  const mergedConfig = configMergerFactory({ mock: true }, config, getHttpConfigFromRequest);

  const prism = createInstance<LoaderInput>(mergedConfig, components);

  server.all('*', {}, replyHandler<LoaderInput>(prism));

  const prismServer: IPrismHttpServer<LoaderInput> = {
    get prism() {
      return prism;
    },

    get fastify() {
      return server;
    },

    listen: async (port: number, ...args: any[]) => {
      try {
        await prism.load(loaderInput);
      } catch (e) {
        console.error('Error loading data into prism.', e);
        throw e;
      }

      return server.listen(port, ...args);
    },
  };

  return prismServer;
};

const replyHandler = <LoaderInput>(
  prism: TPrismHttpInstance<LoaderInput>
): fastify.RequestHandler<IncomingMessage, ServerResponse> => {
  const handler = async (
    request: fastify.FastifyRequest<IncomingMessage>,
    reply: fastify.FastifyReply<ServerResponse>
  ) => {
    try {
      const {
        req: { method, url },
        body,
        headers,
        query,
      } = request;

      const response = await prism.process({
        method: (method ? method.toLowerCase() : 'get') as IHttpMethod,
        url: {
          path: (url || '/').split('?')[0],
          query,
        },
        headers,
        body,
      });

      const { output } = response;
      if (output) {
        reply.code(output.statusCode);

        if (output.headers) {
          reply.headers(output.headers);
        }

        reply.serializer((payload: unknown) => payload);
        reply.send(output.body);
      } else {
        reply.code(500).send('Unable to find any decent response for the current request.');
      }
    } catch (e) {
      reply.code(500).send(e);
    }
  };
  return handler;
};
