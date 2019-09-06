import { IPrism } from '@stoplight/prism-core';
import { IHttpOperation } from '@stoplight/types';
// @ts-ignore
import logger from 'abstract-logging';
import { getStatusText } from 'http-status-codes';
import { defaults } from 'lodash';
import { parse as parseQueryString } from 'querystring';
import { parse as parseUrl } from 'url';
import { createInstance } from '.';
import { forwarder } from './forwarder';
import { mocker } from './mocker';
import { router } from './router';
import { IHttpConfig, IHttpRequest, IHttpResponse } from './types';
import { validator } from './validator';

const createNewClientInstance = (defaultConfig: IHttpConfig, resources: IHttpOperation[]): PrismHttp => {
  const obj = createInstance(defaultConfig, {
    logger,
    router,
    forwarder,
    validator,
    mocker,
  });

  const request: genericRequestFn = async (url, input, config) => {
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
      resources,
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
    get: (url, input, config) => request(url, { method: 'get', ...input }, config),
    put: (url, input, config) => request(url, { method: 'put', ...input }, config),
    post: (url, input, config) => request(url, { method: 'post', ...input }, config),
    delete: (url, input, config) => request(url, { method: 'delete', ...input }, config),
    options: (url, input, config) => request(url, { method: 'options', ...input }, config),
    head: (url, input, config) => request(url, { method: 'head', ...input }, config),
    patch: (url, input, config) => request(url, { method: 'patch', ...input }, config),
    trace: (url, input, config) => request(url, { method: 'trace', ...input }, config),
  };
};

type PrismOutput = ReturnType<IPrism<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig>['request']>;

type genericRequestFn = (url: string, input: Omit<IHttpRequest, 'url'>, config?: IHttpConfig) => PrismOutput;

type requestImplicitVerbFn = (
  url: string,
  input: Omit<IHttpRequest, 'url' | 'method'>,
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
