import { factory } from '@stoplight/prism-core';
import { IHttpOperation } from '@stoplight/types';
import { defaults } from 'lodash';
import mock from './mocker';
import route from './router';
import { validateInput, validateOutput } from './validator';
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
  PrismHttpComponents,
  PrismHttpInstance,
  ProblemJson,
  ProblemJsonError,
} from './types';

const createInstance = (config: IHttpConfig, components?: PickRequired<Partial<PrismHttpComponents>, 'logger'>) => {
  return factory<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig>(
    config,
    defaults(components, { route, validateInput, validateOutput, mock }),
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
  PrismHttpInstance,
  IHttpOperationConfig,
  PrismHttpComponents,
  ProblemJsonError,
  ProblemJson,
  PickRequired,
};
