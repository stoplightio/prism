import { configMergerFactory, createLogger } from '@stoplight/prism-core';
import { createInstance, IHttpMethod, ProblemJsonError, TPrismHttpInstance } from '@stoplight/prism-http';
import * as fastify from 'fastify';
import { IncomingMessage, ServerResponse } from 'http';
import { getHttpConfigFromRequest } from './getHttpConfigFromRequest';
import { IPrismHttpServer, IPrismHttpServerOpts } from './types';

export const createServer = <LoaderInput>(
  loaderInput: LoaderInput,
  opts: IPrismHttpServerOpts<LoaderInput>,
): IPrismHttpServer<LoaderInput> => {
  const { components = {}, config } = opts;

  const server = fastify({
    logger: createLogger('HTTP SERVER'),
    disableRequestLogging: true,
    modifyCoreObjects: false,
  });

  const mergedConfig = configMergerFactory({ mock: { dynamic: false } }, config, getHttpConfigFromRequest);

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
  prism: TPrismHttpInstance<LoaderInput>,
): fastify.RequestHandler<IncomingMessage, ServerResponse> => {
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
      },
      headers,
      body,
    };

    try {
      const response = await prism.process(input);

      const { output } = response;
      if (output) {
        reply.code(output.statusCode);

        if (output.headers) {
          reply.headers(output.headers);
        }

        reply.send(output.body);
        request.log.success({ input }, 'Request terminated.');
      } else {
        throw new Error('Unable to find any decent response for the current request.');
      }
    } catch (e) {
      const status = 'status' in e ? e.status : 500;
      reply
        .type('application/problem+json')
        .serializer(JSON.stringify)
        .code(status)
        .send(ProblemJsonError.fromPlainError(e));

      request.log.error({ input }, 'Request terminated with error');
    }
  };
};
