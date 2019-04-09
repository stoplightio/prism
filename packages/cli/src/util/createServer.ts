import { httpLoaderInstance } from '@stoplight/prism-core';
import { createServer as createHttpServer } from '@stoplight/prism-http-server';

export function createServer(spec: string, mock: boolean) {
  return spec && isHttp(spec)
    ? createHttpServer(
        { url: spec },
        { components: { loader: httpLoaderInstance }, config: { mock } }
      )
    : createHttpServer({ path: spec }, { config: { mock } });
}

function isHttp(spec: string) {
  return !!spec.match(/^https?:\/\//);
}
