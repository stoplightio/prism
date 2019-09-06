import { IPrismOutput } from '@stoplight/prism-core';
// @ts-ignore
import logger from 'abstract-logging';
import { getStatusText } from 'http-status-codes';
import { defaults } from 'lodash';
import { parse as parseQueryString } from 'querystring';
import { parse as parseUrl } from 'url';
import { createInstance } from '.';
import { forwarder } from './forwarder';
import { getHttpOperationsFromFile } from './getHttpOperations';
import { mocker } from './mocker';
import { router } from './router';
import { IHttpConfig, IHttpRequest, IHttpResponse, IHttpUrl } from './types';
import { validator } from './validator';

const createNewClientInstance = async (defaultConfig: IHttpConfig, spec: string): Promise<PrismHttp> => {
  const obj = createInstance(defaultConfig, {
    logger,
    router,
    forwarder,
    validator,
    mocker,
  });

  const resources = await getHttpOperationsFromFile(spec);

  const request: RequestFunction = async (url, input, config) => {
    const parsedUrl = parseUrl(url);

    if (!parsedUrl.pathname) throw new Error('path name must alwasy be specified');

    const httpUrl: IHttpUrl = {
      baseUrl: parsedUrl.host ? `${parsedUrl.protocol}//${parsedUrl.host}` : undefined,
      path: parsedUrl.pathname,
      query: parseQueryString(parsedUrl.query || ''),
    };

    const data = await obj.request(
      {
        ...input,
        url: httpUrl,
      },
      resources,
      config,
    );

    const o: PrismOutput = {
      status: data.output.statusCode,
      statusText: getStatusText(data.output.statusCode),
      headers: data.output.headers || {},
      data: data.output.body || {},
      config: defaults(config, defaultConfig),
      request: { ...input, url: httpUrl },
      validations: data.validations,
    };

    return o;
  };

  return {
    request,
    get: (url, input, config) => request(url, { method: 'get', ...input }, config),
    put: (url, body, input, config) => request(url, { method: 'put', ...input, body }, config),
    post: (url, body, input, config) => request(url, { method: 'post', ...input, body }, config),
    delete: (url, input, config) => request(url, { method: 'delete', ...input }, config),
    options: (url, input, config) => request(url, { method: 'options', ...input }, config),
    head: (url, input, config) => request(url, { method: 'head', ...input }, config),
    patch: (url, body, input, config) => request(url, { method: 'patch', ...input, body }, config),
    trace: (url, input, config) => request(url, { method: 'trace', ...input }, config),
  };
};

type PrismOutput = {
  status: IHttpResponse['statusCode'];
  statusText: string;
  headers: IHttpResponse['headers'];
  data: IHttpResponse['body'];
  config: IHttpConfig;
  request: IHttpRequest;
  validations: IPrismOutput<IHttpRequest, IHttpResponse>['validations'];
};

type RequestFunction = (url: string, input: Omit<IHttpRequest, 'url'>, config?: IHttpConfig) => Promise<PrismOutput>;

type RequestFunctionWithVerb = (
  url: string,
  input: Omit<IHttpRequest, 'url' | 'method'>,
  config?: IHttpConfig,
) => Promise<PrismOutput>;

type RequestFunctionWithVerbWithBody = (
  url: string,
  body: unknown,
  input: Omit<IHttpRequest, 'url' | 'method' | 'body'>,
  config?: IHttpConfig,
) => Promise<PrismOutput>;

export type PrismHttp = {
  request: RequestFunction;
  get: RequestFunctionWithVerb;
  put: RequestFunctionWithVerbWithBody;
  post: RequestFunctionWithVerbWithBody;
  delete: RequestFunctionWithVerb;
  options: RequestFunctionWithVerb;
  head: RequestFunctionWithVerb;
  patch: RequestFunctionWithVerbWithBody;
  trace: RequestFunctionWithVerb;
};

export default createNewClientInstance;
