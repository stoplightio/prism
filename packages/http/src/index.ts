import { factory, IPrism } from '@stoplight/prism-core';
import { IHttpOperation } from '@stoplight/types';
import { getStatusText } from 'http-status-codes';
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

const createInstance = (defaultConfig: IHttpConfig, components?: PickRequired<TPrismHttpComponents, 'logger'>) =>
  factory<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig>(
    defaultConfig,
    defaults(components, {
      router,
      forwarder,
      validator,
      mocker,
    }),
  );

const createNewClientInstance = (
  defaultConfig: IHttpConfig,
  components?: PickRequired<TPrismHttpComponents, 'logger'>,
  defaultResources?: IHttpOperation[],
): PrismHttp => {
  const obj = factory<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig>(
    defaultConfig,
    defaults(components, {
      router,
      forwarder,
      validator,
      mocker,
    }),
  );

  return {
    request: async (input, resources, config) => {
      const data = await obj.request(input, resources || defaultResources || [], config);

      if (data.output) {
        return {
          status: data.output.statusCode,
          statusText: getStatusText(data.output.statusCode),
          headers: data.output.headers || [],
          data: data.output.body || {},
          config: defaults(config, defaultConfig),
          request: input,
          validations: data.validations,
        };
      }

      return data;
    },
    get: (input, resources, config) =>
      obj.request({ method: 'get', ...input }, resources || defaultResources || [], config),
    put: (input, resources, config) =>
      obj.request({ method: 'put', ...input }, resources || defaultResources || [], config),
    post: (input, resources, config) =>
      obj.request({ method: 'post', ...input }, resources || defaultResources || [], config),
    delete: (input, resources, config) =>
      obj.request({ method: 'delete', ...input }, resources || defaultResources || [], config),
    options: (input, resources, config) =>
      obj.request({ method: 'options', ...input }, resources || defaultResources || [], config),
    head: (input, resources, config) =>
      obj.request({ method: 'head', ...input }, resources || defaultResources || [], config),
    patch: (input, resources, config) =>
      obj.request({ method: 'patch', ...input }, resources || defaultResources || [], config),
    trace: (input, resources, config) =>
      obj.request({ method: 'trace', ...input }, resources || defaultResources || [], config),
  };
};

type requestFn = (
  input: IHttpRequest,
  resources?: IHttpOperation[],
  config?: IHttpConfig,
) => ReturnType<IPrism<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig>['request']>;
type requestFnVerb = (input: Omit<IHttpRequest, 'method'>, resources?: IHttpOperation[], config?: IHttpConfig) => void;

export type PrismHttp = {
  request: requestFn;
  get: requestFnVerb;
  put: requestFnVerb;
  post: requestFnVerb;
  delete: requestFnVerb;
  options: requestFnVerb;
  head: requestFnVerb;
  patch: requestFnVerb;
  trace: requestFnVerb;
};

export {
  IHttpConfig,
  IHttpMethod,
  IHttpRequest,
  IHttpResponse,
  IHttpNameValue,
  IHttpNameValues,
  createInstance,
  createNewClientInstance,
  TPrismHttpInstance,
  IHttpOperationConfig,
  TPrismHttpComponents,
  ProblemJsonError,
  ProblemJson,
  PickRequired,
};
