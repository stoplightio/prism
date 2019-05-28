import { createLogger, HttpLoader } from '@stoplight/prism-core';
import { IHttpConfig } from '@stoplight/prism-http';
import { createServer as createHttpServer } from '@stoplight/prism-http-server';

export function createServer(spec: string, config: IHttpConfig) {
  const logger = createLogger('HTTP SERVER');

  return spec && isHttp(spec)
    ? createHttpServer({ url: spec }, { components: { loader: new HttpLoader(), logger }, config })
    : createHttpServer({ path: spec }, { config, components: { logger } });
}

function isHttp(spec: string) {
  return !!spec.match(/^https?:\/\//);
}
