import { IPrism } from '@stoplight/prism-core';
import { IHttpOperation } from '@stoplight/types';
import { getStatusText } from 'http-status-codes';
import { defaults } from 'lodash';
import { Logger } from 'pino';
import { parse as parseQueryString } from 'querystring';
import { parse as parseUrl } from 'url';
import { createInstance } from '.';
import { forwarder } from './forwarder';
import { mocker } from './mocker';
import { router } from './router';
import { IHttpConfig, IHttpRequest, IHttpResponse } from './types';
import { validator } from './validator';

const createNewClientInstance = (
  defaultConfig: IHttpConfig,
  logger: Logger,
  defaultResources?: IHttpOperation[],
): PrismHttp => {
  const obj = createInstance(defaultConfig, {
    logger,
    router,
    forwarder,
    validator,
    mocker,
  });

  const request: genericRequestFn = async (url, input, resources, config) => {
    const parsedUrl = parseUrl(url);

    if (!parsedUrl.pathname) throw new Error('path name must alwasy be specified');

    const res = resources || defaultResources || [];

    const data = await obj.request(
      {
        ...input,
        url: {
          baseUrl: parsedUrl.host ? `${parsedUrl.protocol}//${parsedUrl.host}` : undefined,
          path: parsedUrl.pathname,
          query: parseQueryString(parsedUrl.query || ''),
        },
      },
      res,
      config,
    );

    if (data.output) {
      return {
        status: data.output.statusCode,
        statusText: getStatusText(data.output.statusCode),
        headers: data.output.headers || [],
        data: data.output.body || {},
        config: defaults(config, defaultConfig),
        request: { ...input, url },
        validations: data.validations,
      };
    }

    return data;
  };

  return {
    request,
    get: (url, input, resources, config) => request(url, { method: 'get', ...input }, resources, config),
    put: (url, input, resources, config) => request(url, { method: 'put', ...input }, resources, config),
    post: (url, input, resources, config) => request(url, { method: 'post', ...input }, resources, config),
    delete: (url, input, resources, config) => request(url, { method: 'delete', ...input }, resources, config),
    options: (url, input, resources, config) => request(url, { method: 'options', ...input }, resources, config),
    head: (url, input, resources, config) => request(url, { method: 'head', ...input }, resources, config),
    patch: (url, input, resources, config) => request(url, { method: 'patch', ...input }, resources, config),
    trace: (url, input, resources, config) => request(url, { method: 'trace', ...input }, resources, config),
  };
};

type PrismOutput = ReturnType<IPrism<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig>['request']>;

type genericRequestFn = (
  url: string,
  input: Omit<IHttpRequest, 'url'>,
  resources?: IHttpOperation[],
  config?: IHttpConfig,
) => PrismOutput;

type requestImplicitVerbFn = (
  url: string,
  input: Omit<IHttpRequest, 'url' | 'method'>,
  resources?: IHttpOperation[],
  config?: IHttpConfig,
) => PrismOutput;

export type PrismHttp = {
  request: genericRequestFn;
  get: requestImplicitVerbFn;
  put: requestImplicitVerbFn;
  post: requestImplicitVerbFn;
  delete: requestImplicitVerbFn;
  options: requestImplicitVerbFn;
  head: requestImplicitVerbFn;
  patch: requestImplicitVerbFn;
  trace: requestImplicitVerbFn;
};

export default createNewClientInstance;
