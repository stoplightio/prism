import { IPrismOutput } from '@stoplight/prism-core';
import { IHttpOperation } from '@stoplight/types';
// @ts-ignore
import logger from 'abstract-logging';
import { getOrElse } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { getStatusText } from 'http-status-codes';
import { defaults, partial } from 'lodash';
import { parse as parseQueryString } from 'querystring';
import { parse as parseUrl } from 'url';
import { createInstance } from '.';
import { forwarder } from './forwarder';
import getHttpOperations, { getHttpOperationsFromResource } from './getHttpOperations';
import { mocker } from './mocker';
import { router } from './router';
import { IHttpConfig, IHttpRequest, IHttpResponse, IHttpUrl } from './types';
import { validator } from './validator';

function createClientFrom(
  getResource: (v: string) => Promise<IHttpOperation[]>,
  spec: string,
  defaultConfig: IHttpConfig,
): Promise<PrismHttp> {
  return getResource(spec).then(resources => createClientFromOperations(resources, defaultConfig));
}

const createClientFromResource = partial(createClientFrom, getHttpOperationsFromResource);
const createClientFromString = partial(createClientFrom, getHttpOperations);

function createClientFromOperations(resources: IHttpOperation[], defaultConfig: IHttpConfig) {
  const obj = createInstance(defaultConfig, {
    logger,
    router,
    forwarder,
    validator,
    mocker,
  });

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

    const output: PrismOutput = {
      status: data.output.statusCode,
      statusText: pipe(
        data.output.statusText,
        getOrElse(() => getStatusText(data.output.statusCode)),
      ),
      headers: data.output.headers || {},
      data: data.output.body || {},
      config: defaults(config, defaultConfig),
      request: { ...input, url: httpUrl },
      validations: data.validations,
    };

    return output;
  };

  type headersFromRequest = Required<Pick<IHttpRequest, 'headers'>>;

  function isInput(input?: headersFromRequest | IHttpConfig): input is headersFromRequest {
    return !!input && 'headers' in input;
  }

  return {
    request,
    get: (url: string, input?: headersFromRequest | IHttpConfig, config?: IHttpConfig) =>
      isInput(input) ? request(url, { method: 'get', ...input }, config) : request(url, { method: 'get' }, input),
    put: (url: string, body: unknown, input?: headersFromRequest | IHttpConfig, config?: IHttpConfig) =>
      isInput(input)
        ? request(url, { method: 'put', ...input, body }, config)
        : request(url, { method: 'put', body }, input),
    post: (url: string, body: unknown, input?: headersFromRequest | IHttpConfig, config?: IHttpConfig) =>
      isInput(input)
        ? request(url, { method: 'post', ...input, body }, config)
        : request(url, { method: 'post', body }, input),
    delete: (url: string, input?: headersFromRequest | IHttpConfig, config?: IHttpConfig) =>
      isInput(input) ? request(url, { method: 'delete', ...input }, config) : request(url, { method: 'delete' }, input),
    options: (url: string, input?: headersFromRequest | IHttpConfig, config?: IHttpConfig) =>
      isInput(input)
        ? request(url, { method: 'options', ...input }, config)
        : request(url, { method: 'options' }, input),
    head: (url: string, input?: headersFromRequest | IHttpConfig, config?: IHttpConfig) =>
      isInput(input) ? request(url, { method: 'head', ...input }, config) : request(url, { method: 'head' }, input),
    patch: (url: string, body: unknown, input?: headersFromRequest | IHttpConfig, config?: IHttpConfig) =>
      isInput(input)
        ? request(url, { method: 'patch', ...input, body }, config)
        : request(url, { method: 'patch', body }, input),
    trace: (url: string, input?: headersFromRequest | IHttpConfig, config?: IHttpConfig) =>
      isInput(input) ? request(url, { method: 'trace', ...input }, config) : request(url, { method: 'trace' }, input),
  };
}

type PrismOutput = {
  status: IHttpResponse['statusCode'];
  statusText: string;
  headers: IHttpResponse['headers'];
  data: unknown;
  config: IHttpConfig;
  request: IHttpRequest;
  validations: IPrismOutput<IHttpRequest, IHttpResponse>['validations'];
};

type RequestFunction = (url: string, input: Omit<IHttpRequest, 'url'>, config?: IHttpConfig) => Promise<PrismOutput>;

interface IRequestFunctionWithMethod {
  (url: string, input: Required<Pick<IHttpRequest, 'headers'>>, config?: IHttpConfig): Promise<PrismOutput>;
  (url: string, config?: IHttpConfig): Promise<PrismOutput>;
}

interface IRequestFunctionWithMethodWithBody {
  (url: string, body: unknown, input: Required<Pick<IHttpRequest, 'headers'>>, config?: IHttpConfig): Promise<
    PrismOutput
  >;
  (url: string, body: unknown, config?: IHttpConfig): Promise<PrismOutput>;
}

export type PrismHttp = {
  request: RequestFunction;
  get: IRequestFunctionWithMethod;
  put: IRequestFunctionWithMethodWithBody;
  post: IRequestFunctionWithMethodWithBody;
  delete: IRequestFunctionWithMethod;
  options: IRequestFunctionWithMethod;
  head: IRequestFunctionWithMethod;
  patch: IRequestFunctionWithMethodWithBody;
  trace: IRequestFunctionWithMethod;
};

export { createClientFromResource, createClientFromString, createClientFromOperations };
