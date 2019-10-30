import { IPrism, IPrismComponents, IPrismConfig } from '@stoplight/prism-core';
import { Dictionary, HttpMethod, IHttpOperation, INodeExample, INodeExternalExample } from '@stoplight/types';
import { JSONSchema4, JSONSchema6, JSONSchema7 } from 'json-schema';

export type PrismHttpInstance = IPrism<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig>;

export type PrismHttpComponents = IPrismComponents<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig>;

export interface IHttpOperationConfig {
  mediaTypes?: string[];
  code?: string;
  exampleKey?: string;
  dynamic: boolean;
}

export interface IHttpConfig extends IPrismConfig {
  mock: false | IHttpOperationConfig;
}

export interface IHttpProxyConfig extends IHttpConfig {
  mock: false;
  upstream: URL;
}

export type IMockHttpConfig = IHttpConfig & { mock: IHttpOperationConfig };

export type IHttpNameValues = Dictionary<string | string[]>;

export type IHttpNameValue = Dictionary<string>;

export interface IHttpUrl {
  baseUrl?: string;
  path: string;
  query?: IHttpNameValues;
}

export interface IHttpRequest {
  method: HttpMethod;
  url: IHttpUrl;
  headers?: IHttpNameValue;
  body?: unknown;
}

export interface IHttpResponse {
  statusCode: number;
  headers?: IHttpNameValue;
  body?: unknown;
}

export type ProblemJson = {
  type: string;
  title: string;
  status: number;
  detail: unknown;
};

export class ProblemJsonError extends Error {
  public static fromTemplate(
    template: Omit<ProblemJson, 'detail'>,
    detail?: string,
    additional?: Dictionary<unknown>
  ): ProblemJsonError {
    const error = new ProblemJsonError(
      `https://stoplight.io/prism/errors#${template.type}`,
      template.title,
      template.status,
      detail || '',
      additional
    );
    Error.captureStackTrace(error, ProblemJsonError);

    return error;
  }

  public static fromPlainError(
    error: Error & { detail?: string; status?: number; additional?: Dictionary<unknown> }
  ): ProblemJson {
    return {
      type: error.name && error.name !== 'Error' ? error.name : 'https://stoplight.io/prism/errors#UNKNOWN',
      title: error.message,
      status: error.status || 500,
      detail: error.detail || '',
      ...error.additional,
    };
  }

  constructor(
    readonly name: string,
    readonly message: string,
    readonly status: number,
    readonly detail: string,
    readonly additional?: Dictionary<unknown>
  ) {
    super(message);
    Error.captureStackTrace(this, ProblemJsonError);
  }
}

export type ContentExample = INodeExample | INodeExternalExample;
export type PayloadGenerator = (f: JSONSchema) => unknown;

export type PickRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

export type JSONSchema = JSONSchema4 | JSONSchema6 | JSONSchema7;
