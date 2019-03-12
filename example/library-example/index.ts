import { FilesystemLoader, IPrism } from '@stoplight/prism-core';
import { createInstance } from '@stoplight/prism-http';
import { IHttpConfig, IHttpMethod, IHttpRequest, IHttpResponse } from '@stoplight/prism-http';
import { IHttpOperation } from '@stoplight/types';
import fastify = require('fastify');
import { IncomingMessage, ServerResponse } from 'http';
import { relative } from 'path';

const PORT = 3000;

async function init() {
  const prism = createInstance();
  await prism.load({ path: relative(process.cwd(), process.argv[2]) });

  const server = fastify();
  server.all('*', createRequestHandler(prism));
  return server.listen(PORT);
}

function createRequestHandler(
  prism: IPrism<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig, FilesystemLoader>
) {
  return async (
    req: fastify.FastifyRequest<IncomingMessage>,
    res: fastify.FastifyReply<ServerResponse>
  ) => {
    try {
      const {
        req: { method, url },
        body,
        headers,
        query,
      } = req;

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
        res.code(output.statusCode);

        if (output.headers) {
          res.headers(output.headers);
        }

        if (output.body) {
          // body is already serialized
          res.serializer((payload: any) => payload);
          res.send(output.body);
        }
      }
    } catch (e) {
      res.code(500).send(e);
    }
  };
}

init()
  .then(() => console.log(`listening on http://localhost:${PORT}`))
  .catch(console.error);
