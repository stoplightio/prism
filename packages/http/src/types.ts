import { IPrism, IPrismComponents, IPrismProxyConfig, IPrismMockConfig } from '@stoplight/prism-core';
import { Overwrite } from 'utility-types';
import { Dictionary, HttpMethod, IHttpOperation, INodeExample, INodeExternalExample } from '@stoplight/types';
import type { JSONSchema7 } from 'json-schema';
import { Either } from 'fp-ts/Either';

export type PrismHttpInstance = IPrism<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig>;

export type PrismHttpComponents = IPrismComponents<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig>;

export interface IHttpOperationConfig {
  mediaTypes?: string[];
  code?: number;
  exampleKey?: string;
  dynamic: boolean;
  ignoreExamples?: boolean;
}

export type IHttpMockConfig = Overwrite<IPrismMockConfig, { mock: IHttpOperationConfig }>;
export type IHttpProxyConfig = Overwrite<IPrismProxyConfig, { mock: IHttpOperationConfig }>;

export type IHttpConfig = IHttpProxyConfig | IHttpMockConfig;

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
  detail: string;
};

export class ProblemJsonError extends Error {
  public static fromTemplate(
    template: Omit<ProblemJson, 'detail'>,
    detail?: string,
    additional?: Dictionary<unknown>
  ): ProblemJsonError {
    return new ProblemJsonError(
      `${template.type}`,
      template.title,
      template.status,
      detail || '',
      additional
    );
  }

  public static toProblemJson(
    error: Error & { detail?: string; status?: number; additional?: Dictionary<unknown> }
  ): ProblemJson {
    return {
      type: error.name && error.name !== 'Error' ? error.name : 'UNKNOWN',
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
  }
}

export type ContentExample = INodeExample | INodeExternalExample;
export type PayloadGenerator = (f: JSONSchema) => Either<Error, unknown>;

export type PickRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
export type JSONSchema = JSONSchema7;
