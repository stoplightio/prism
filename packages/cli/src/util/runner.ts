import { getHttpOperationsFromResource } from '@stoplight/prism-http';
import { IPrismHttpServer } from '@stoplight/prism-http-server/src/types';
import * as chokidar from 'chokidar';
import * as os from 'os';
import { CreateMockServerOptions } from './createServer';

export type CreatePrism = (options: CreateMockServerOptions) => Promise<IPrismHttpServer | void>;

export function runPrismAndSetupWatcher(createPrism: CreatePrism, options: CreateMockServerOptions) {
  return createPrism(options).then(possibleServer => {
    if (possibleServer) {
      let server: IPrismHttpServer = possibleServer;

      const watcher = chokidar.watch(options.document, {
        // See https://github.com/paulmillr/chokidar#persistence
        persistent: os.platform() === 'darwin',
        disableGlobbing: true,
        awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
      });

      watcher.on('change', () => {
        server.logger.info('Restarting Prism...');

        getHttpOperationsFromResource(options.document)
          .then(operations => {
            if (operations.length === 0) {
              server.logger.info(
                'No operations found in the current file, continuing with the previously loaded spec.'
              );
            } else {
              return server
                .close()
                .then(() => {
                  server.logger.info('Loading the updated operations...');

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
            server.logger.info('Something went terribly wrong, trying to start Prism with the original document.');

            return server
              .close()
              .then(() => createPrism(options))
              .catch(() => process.exit(1));
          });
      });

      return new Promise(resolve => watcher.once('ready', resolve));
    }
  });
}
