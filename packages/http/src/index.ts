import { factory } from '@stoplight/prism-core';
import { IHttpOperation } from '@stoplight/types';
import { forwarder } from './forwarder';
import { mocker } from './mocker';
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

const createInstance = (config?: IHttpConfig, overrides?: PickRequired<TPrismHttpComponents, 'logger'>) => {
  return factory<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig>(
    { cors: true, mock: { dynamic: false }, validateRequest: true, validateResponse: true },
    {
      router,
      forwarder,
      validator,
      mocker,
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
