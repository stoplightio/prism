import { IPrismOutput } from '@stoplight/prism-core';
import { IHttpOperation } from '@stoplight/types';
import { defaults } from 'lodash';
import { parse as parseQueryString } from 'querystring';
import { parse as parseUrl } from 'url';
import { createInstance } from '.';
import { IHttpConfig, IHttpRequest, IHttpResponse, IHttpUrl } from './types';
import { fold } from 'fp-ts/TaskEither';
import * as Task from 'fp-ts/Task';
import { pipe } from 'fp-ts/function';
import * as pino from 'pino';

const logger = pino();
logger.success = logger.info;

type IClientConfig = IHttpConfig & {
  baseUrl?: string;
};

export function createClientFromOperations(resources: IHttpOperation[], defaultConfig: IClientConfig): PrismHttp {
  const obj = createInstance(defaultConfig, { logger });

  type headersFromRequest = Required<Pick<IHttpRequest, 'headers'>>;

  function isInput(input?: headersFromRequest | Partial<IClientConfig>): input is headersFromRequest {
    return !!input && 'headers' in input;
  }

  const client: PrismHttp = {
    request(url, input, config) {
      const parsedUrl = parseUrl(url);

      if (!parsedUrl.pathname) throw new Error('Path name must always be specified');

      const mergedConf: IClientConfig = defaults(config, defaultConfig);

      const httpUrl: IHttpUrl = {
        baseUrl: parsedUrl.host ? `${parsedUrl.protocol}//${parsedUrl.host}` : mergedConf.baseUrl,
        path: parsedUrl.pathname,
        query: parseQueryString(parsedUrl.query || ''),
      };

      return pipe(
        obj.request({ ...input, url: httpUrl }, resources, mergedConf),
        fold(
          e => {
            throw e;
          },
          data =>
            Task.of({
              status: data.output.statusCode,
              headers: data.output.headers || {},
              data: data.output.body,
              config: mergedConf,
              request: { ...input, url: httpUrl },
              violations: data.validations,
            })
        )
      )();
    },
    get(url: string, input?: headersFromRequest | Partial<IClientConfig>, config?: Partial<IClientConfig>) {
      return isInput(input)
        ? this.request(url, { method: 'get', ...input }, config)
        : this.request(url, { method: 'get' }, input);
    },
    put(
      url: string,
      body: unknown,
      input?: headersFromRequest | Partial<IClientConfig>,
      config?: Partial<IClientConfig>
    ) {
      return isInput(input)
        ? this.request(url, { method: 'put', ...input, body }, config)
        : this.request(url, { method: 'put', body }, input);
    },
    post(
      url: string,
      body: unknown,
      input?: headersFromRequest | Partial<IClientConfig>,
      config?: Partial<IClientConfig>
    ) {
      return isInput(input)
        ? this.request(url, { method: 'post', ...input, body }, config)
        : this.request(url, { method: 'post', body }, input);
    },
    delete(url: string, input?: headersFromRequest | Partial<IClientConfig>, config?: Partial<IClientConfig>) {
      return isInput(input)
        ? this.request(url, { method: 'delete', ...input }, config)
        : this.request(url, { method: 'delete' }, input);
    },
    options(url: string, input?: headersFromRequest | Partial<IClientConfig>, config?: Partial<IClientConfig>) {
      return isInput(input)
        ? this.request(url, { method: 'options', ...input }, config)
        : this.request(url, { method: 'options' }, input);
    },
    head(url: string, input?: headersFromRequest | Partial<IClientConfig>, config?: Partial<IClientConfig>) {
      return isInput(input)
        ? this.request(url, { method: 'head', ...input }, config)
        : this.request(url, { method: 'head' }, input);
    },
    patch(
      url: string,
      body: unknown,
      input?: headersFromRequest | Partial<IClientConfig>,
      config?: Partial<IClientConfig>
    ) {
      return isInput(input)
        ? this.request(url, { method: 'patch', ...input, body }, config)
        : this.request(url, { method: 'patch', body }, input);
    },
    trace(url: string, input?: headersFromRequest | Partial<IClientConfig>, config?: Partial<IClientConfig>) {
      return isInput(input)
        ? this.request(url, { method: 'trace', ...input }, config)
        : this.request(url, { method: 'trace' }, input);
    },
  };

  return client;
}

type PrismOutput = {
  status: IHttpResponse['statusCode'];
  headers: IHttpResponse['headers'];
  data: unknown;
  config: IClientConfig;
  request: IHttpRequest;
  violations: IPrismOutput<IHttpResponse>['validations'];
};

type RequestFunction = (
  this: PrismHttp,
  url: string,
  input: Omit<IHttpRequest, 'url'>,
  config?: Partial<IClientConfig>
) => Promise<PrismOutput>;

interface IRequestFunctionWithMethod {
  (
    this: PrismHttp,
    url: string,
    input: Required<Pick<IHttpRequest, 'headers'>>,
    config?: Partial<IClientConfig>
  ): Promise<PrismOutput>;
  (this: PrismHttp, url: string, config?: Partial<IClientConfig>): Promise<PrismOutput>;
}

interface IRequestFunctionWithMethodWithBody {
  (
    this: PrismHttp,
    url: string,
    body: unknown,
    input: Required<Pick<IHttpRequest, 'headers'>>,
    config?: Partial<IClientConfig>
  ): Promise<PrismOutput>;
  (this: PrismHttp, url: string, body: unknown, config?: Partial<IClientConfig>): Promise<PrismOutput>;
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
