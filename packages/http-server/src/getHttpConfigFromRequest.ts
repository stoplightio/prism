import {
  PartialPrismConfig,
  PartialPrismConfigFactory,
  resolveConfig,
} from '@stoplight/prism-core';
import { IHttpConfig, IHttpRequest } from '@stoplight/prism-http';

export const getHttpConfigFromRequest: PartialPrismConfigFactory<IHttpConfig, IHttpRequest> = (
  req: IHttpRequest,
  defaultConfig?: PartialPrismConfig<IHttpConfig, IHttpRequest>
) => {
  // For some reason this fixed the code coverage.
  let config: Partial<IHttpConfig> = {};

  if (defaultConfig) {
    config = Object.assign(config, resolveConfig<IHttpConfig, IHttpRequest>(req, defaultConfig));
  }

  const httpOperationConfig: any = {};
  const query = req.url.query;

  if (!query) {
    return config;
  }

  const { __code, __dynamic, __contentType, __example } = query;

  if (__code) {
    httpOperationConfig.code = __code;
  }

  if (__dynamic) {
    httpOperationConfig.dynamic = __dynamic === 'true';
  }

  if (__contentType) {
    httpOperationConfig.mediaType = __contentType;
  }

  if (__example) {
    httpOperationConfig.exampleKey = __example;
  }

  if (Object.keys(httpOperationConfig).length) {
    if (typeof config.mock === 'boolean') {
      config.mock = httpOperationConfig;
    } else {
      config.mock = Object.assign({}, config.mock, httpOperationConfig);
    }
    return config;
  }

  return config;
};
