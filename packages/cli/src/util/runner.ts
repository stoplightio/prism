import { getHttpOperationsFromResource } from '@stoplight/prism-http';
import { IPrismHttpServer } from '@stoplight/prism-http-server/src/types';
import * as chokidar from 'chokidar';
import * as os from 'os';
import { CreateMockServerOptions } from './createServer';

type CreatePrism = (options: CreateMockServerOptions) => Promise<IPrismHttpServer | void>;

export function runPrismAndSetupWatcher(createPrism: CreatePrism, options: CreateMockServerOptions) {
  return createPrism(options).then(possiblyServer => {
    if (possiblyServer) {
      let server: IPrismHttpServer = possiblyServer;

      const watcher = chokidar.watch(options.document, {
        // See https://github.com/paulmillr/chokidar#persistence
        persistent: os.platform() === 'darwin',
        disableGlobbing: true,
        awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
      });

      watcher.on('change', () => {
        server.fastify.log.info('Restarting Prism...');

        getHttpOperationsFromResource(options.document)
          .then(operations => {
            if (operations.length === 0) {
              server.fastify.log.info(
                'No operations found in the current file, continuing with the previously loaded spec.'
              );
            } else {
              return server.fastify
                .close()
                .then(() => {
                  server.fastify.log.info('Loading the updated operations...');

                  return createPrism(options);
                })
                .then(newServer => {
                  if (newServer) {
                    server = newServer;
                  }
                });
            }
          })
          .catch(() => {
            server.fastify.log.info('Something went terribly wrong, trying to start Prism with the original document.');

            return server.fastify
              .close()
              .then(() => createPrism(options))
              .catch(() => process.exit(1));
          });
      });

      return new Promise(resolve => watcher.once('ready', resolve));
    }
  });
}
