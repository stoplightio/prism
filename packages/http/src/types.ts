import { IPrism, IPrismComponents, IPrismConfig } from '@stoplight/prism-core';
import { Dictionary, IHttpOperation } from '@stoplight/types';

export type TPrismHttpInstance<LoaderInput> = IPrism<
  IHttpOperation,
  IHttpRequest,
  IHttpResponse,
  IHttpConfig,
  LoaderInput
>;

export type TPrismHttpComponents<LoaderInput> = Partial<
  IPrismComponents<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig, LoaderInput>
>;

// TODO: should be complete | and in the @stoplight/types repo
export type IHttpMethod = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace'; // ... etc

export interface IHttpOperationConfig {
  mediaTypes?: string[];
  code?: string;
  exampleKey?: string;
  dynamic: boolean;
}

export interface IHttpConfig extends IPrismConfig {
  mock: false | IHttpOperationConfig;

  validate?: {
    request?:
      | boolean
      | {
          hijack?: boolean;
          headers?: boolean;
          query?: boolean;
          body?: boolean;
        };

    response?:
      | boolean
      | {
          headers?: boolean;
          body?: boolean;
        };
  };
}

export type IHttpNameValues = Dictionary<string | string[]>;

export type IHttpNameValue = Dictionary<string>;

export interface IHttpUrl {
  baseUrl?: string;
  path: string;
  query?: IHttpNameValues;
}

export interface IHttpRequest {
  method: IHttpMethod;
  url: IHttpUrl;
  headers?: IHttpNameValue;
  body?: any;
}

export interface IHttpResponse {
  statusCode: number;
  headers?: IHttpNameValue;
  body?: any;
}

export type ProblemJson = {
  type: string;
  title: string;
  status: number;
  detail: string;
};

export class ProblemJsonError extends Error {
  public static fromTemplate(template: Omit<ProblemJson, 'detail'>, detail?: string): ProblemJsonError {
    Error.captureStackTrace(this, ProblemJsonError);
    return new ProblemJsonError(
      `https://stoplight.io/prism/errors#${template.type}`,
      template.title,
      template.status,
      detail || '',
    );
  }

  public static fromPlainError(error: Error & { detail?: string; status?: number }): ProblemJson {
    return {
      type: error.name && error.name !== 'Error' ? error.name : 'https://stoplight.io/prism/errors#UNKNOWN',
      title: error.message,
      status: error.status || 500,
      detail: error.detail || '',
    };
  }

  constructor(readonly name: string, readonly message: string, readonly status: number, readonly detail: string) {
    super(message);
    Error.captureStackTrace(this, ProblemJsonError);
  }
}

export type PayloadGenerator = (f: unknown) => Promise<unknown>;

export type PickRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
