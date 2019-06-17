import { HttpLoader } from '@stoplight/prism-core';
import { IHttpConfig } from '@stoplight/prism-http';
import { createServer as createHttpServer } from '@stoplight/prism-http-server';
import { Logger } from 'pino';

export function createServer(spec: string, config: IHttpConfig, logger: Logger) {
  return spec && isHttp(spec)
    ? createHttpServer({ url: spec }, { components: { loader: new HttpLoader(), logger }, config })
    : createHttpServer({ path: spec }, { config, components: { logger } });
}

function isHttp(spec: string) {
  return !!spec.match(/^https?:\/\//);
}
