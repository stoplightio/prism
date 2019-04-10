import { httpLoaderInstance } from '@stoplight/prism-core';
import { IHttpConfig } from '@stoplight/prism-http';
import { createServer as createHttpServer } from '@stoplight/prism-http-server';

export function createServer(spec: string, config: IHttpConfig) {
  return spec && isHttp(spec)
    ? createHttpServer({ url: spec }, { components: { loader: httpLoaderInstance }, config })
    : createHttpServer({ path: spec }, { config });
}

function isHttp(spec: string) {
  return !!spec.match(/^https?:\/\//);
}
