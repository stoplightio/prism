import { factory, FilesystemLoader, PartialPrismConfig } from '@stoplight/prism-core';
import { IHttpOperation } from '@stoplight/types';
import { forwarder } from './forwarder';
import { HttpMocker } from './mocker';
import { generate } from './mocker/generator/JSONSchema';
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

const createInstance = <LoaderInput>(
  config?: PartialPrismConfig<IHttpConfig, IHttpRequest>,
  overrides?: TPrismHttpComponents<LoaderInput>,
) => {
  return factory<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig, LoaderInput>(
    { mock: { dynamic: false } },
    {
      loader: new FilesystemLoader(),
      router,
      forwarder,
      validator,
      mocker: new HttpMocker(generate),
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
