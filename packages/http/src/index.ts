import { factory, PartialPrismConfig } from '@stoplight/prism-core';
import { IHttpOperation } from '@stoplight/types';
import { forwarder } from './forwarder';
import { HttpMocker } from './mocker';
import { router } from './router';
export * from './types';
import {
  IHttpConfig,
  IHttpMethod,
  IHttpNameValue,
  IHttpNameValues,
  IHttpOperationConfig,
  IHttpRequest,
  IHttpResponse,
  PickRequired,
  ProblemJson,
  ProblemJsonError,
  TPrismHttpComponents,
  TPrismHttpInstance,
} from './types';
import { validator } from './validator';

const createInstance = (
  config?: PartialPrismConfig<IHttpConfig, IHttpRequest>,
  overrides?: PickRequired<TPrismHttpComponents, 'logger'>,
) => {
  return factory<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig>(
    { mock: { dynamic: false } },
    {
      router,
      forwarder,
      validator,
      mocker: new HttpMocker(),
    },
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
  ProblemJsonError,
  ProblemJson,
  PickRequired,
};
