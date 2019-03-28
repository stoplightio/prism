import { factory, filesystemLoaderInstance, PartialPrismConfig } from '@stoplight/prism-core';
import { IHttpOperation } from '@stoplight/types';

import { forwarder } from './forwarder';
import { HttpMocker } from './mocker';
import { JSONSchemaExampleGenerator } from './mocker/generator/JSONSchemaExampleGenerator';
import { router } from './router';
import {
  IHttpConfig,
  IHttpMethod,
  IHttpNameValue,
  IHttpNameValues,
  IHttpOperationConfig,
  IHttpRequest,
  IHttpResponse,
  TPrismHttpComponents,
  TPrismHttpInstance,
} from './types';
import { validator } from './validator';

const createInstance = <LoaderInput>(
  config?: PartialPrismConfig<IHttpConfig, IHttpRequest>,
  overrides?: TPrismHttpComponents<LoaderInput>
) => {
  return factory<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig, LoaderInput>(
    { mock: true },
    {
      loader: filesystemLoaderInstance,
      router,
      forwarder,
      validator,
      mocker: new HttpMocker(new JSONSchemaExampleGenerator()),
    }
  )(config, overrides);
};

export {
  IHttpConfig,
  IHttpMethod,
  IHttpRequest,
  IHttpResponse,
  IHttpNameValue,
  IHttpNameValues,
  createInstance,
  TPrismHttpInstance,
  IHttpOperationConfig,
  TPrismHttpComponents,
};
