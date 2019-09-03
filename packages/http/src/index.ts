import { factory } from '@stoplight/prism-core';
import { IHttpOperation } from '@stoplight/types';
import { defaults } from 'lodash';
import { forwarder } from './forwarder';
import { mocker } from './mocker';
import { router } from './router';
import { validator } from './validator';
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

const createInstance = (config: IHttpConfig, components?: PickRequired<TPrismHttpComponents, 'logger'>) => {
  return factory<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig>(
    config,
    defaults(components, {
      router,
      forwarder,
      validator,
      mocker,
    }),
  );
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
