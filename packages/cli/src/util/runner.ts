import { getHttpOperationsFromResource } from '@stoplight/prism-http';
import { IPrismHttpServer } from '@stoplight/prism-http-server/src/types';
import * as chokidar from 'chokidar';
import { CreatePrismOptions } from './createServer';

type CreatePrism = (options: CreatePrismOptions) => Promise<IPrismHttpServer>;

export function runPrismAndSetupWatcher(createPrism: CreatePrism, options: CreatePrismOptions, spec: string) {
  return createPrism(options).then(server => {
    if (server) {
      const watcher = chokidar.watch(spec, { awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 } });

      watcher.on('change', () => {
        server.fastify.log.info('Restarting Prism...');

        getHttpOperationsFromResource(spec)
          .then(operations => {
            if (operations.length === 0) {
              server.fastify.log.info(
                'No operations found in the current file, continuing with the previously loaded spec.',
              );
            } else {
              return server.fastify.close()
                .then(() => {
                  server.fastify.log.info('Loading the updated operations...');

                  return createPrism({ ...options, operations });
                })
                .then((newServer) => server = newServer);
            }
          })
          .catch(() => {
            server.fastify.log.info('Something went terribly wrong, trying to start Prism with the original document.');

            return server.fastify
              .close()
              .then(() => createPrism(options))
              .catch(() => process.exit(1))
          });
      });
    }
  });
}
