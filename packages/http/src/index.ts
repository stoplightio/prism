import { factory, IPrism } from '@stoplight/prism-core';
import { IHttpOperation } from '@stoplight/types';
import { getStatusText } from 'http-status-codes';
import { defaults } from 'lodash';
import { parse as parseQueryString } from 'querystring';
import { parse as parseUrl } from 'url';
import { forwarder } from './forwarder';
import { mocker } from './mocker';
import { router } from './router';
import { validator } from './validator';
export * from './types';
import { Logger } from 'pino';
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
  logger: Logger,
  defaultResources?: IHttpOperation[],
): PrismHttp => {
  const obj = factory<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig>(defaultConfig, {
    logger,
    router,
    forwarder,
    validator,
    mocker,
  });

  const request: requestFn = async (url, input, resources, config) => {
    const parsedUrl = parseUrl(url);

    if (!parsedUrl.pathname) throw new Error('path name must alwasy be specified');

    const data = await obj.request(
      {
        ...input,
        url: {
          baseUrl: parsedUrl.host ? `${parsedUrl.protocol}//${parsedUrl.host}` : undefined,
          path: parsedUrl.pathname,
          query: parseQueryString(parsedUrl.query || ''),
        },
      },
      resources || defaultResources || [],
      config,
    );

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
  };

  return {
    request,
    get: (url, input, resources, config) =>
      request(url, { method: 'get', ...input }, resources || defaultResources || [], config),
    put: (url, input, resources, config) =>
      request(url, { method: 'put', ...input }, resources || defaultResources || [], config),
    post: (url, input, resources, config) =>
      request(url, { method: 'post', ...input }, resources || defaultResources || [], config),
    delete: (url, input, resources, config) =>
      request(url, { method: 'delete', ...input }, resources || defaultResources || [], config),
    options: (url, input, resources, config) =>
      request(url, { method: 'options', ...input }, resources || defaultResources || [], config),
    head: (url, input, resources, config) =>
      request(url, { method: 'head', ...input }, resources || defaultResources || [], config),
    patch: (url, input, resources, config) =>
      request(url, { method: 'patch', ...input }, resources || defaultResources || [], config),
    trace: (url, input, resources, config) =>
      request(url, { method: 'trace', ...input }, resources || defaultResources || [], config),
  };
};

type requestFn = (
  url: string,
  input: Omit<IHttpRequest, 'url'>,
  resources?: IHttpOperation[],
  config?: IHttpConfig,
) => ReturnType<IPrism<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig>['request']>;
type requestFnVerb = (
  url: string,
  input: Omit<IHttpRequest, 'url' | 'method'>,
  resources?: IHttpOperation[],
  config?: IHttpConfig,
) => ReturnType<requestFn>;

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
