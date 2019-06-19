import { IPrism, IPrismComponents, IPrismConfig, IPrismDiagnostic } from '@stoplight/prism-core';
import { Dictionary, HttpMethod, IHttpOperation, INodeExample, INodeExternalExample } from '@stoplight/types';
import { DiagnosticSeverity } from '@stoplight/types';
import { JSONSchema4, JSONSchema6, JSONSchema7 } from 'json-schema';

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
export type IHttpMethod = HttpMethod | 'trace';

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
  responseType?: XMLHttpRequestResponseType;
}

export type ProblemJson = {
  type: string;
  title: string;
  status: number;
  detail: any;
};

function sharedErrorProps(error: any) {
  return {
    type: error.name && error.name !== 'Error' ? error.name : 'https://stoplight.io/prism/errors#UNKNOWN',
    title: error.message,
    status: error.status || 500,
  };
}

export class ProblemJsonError extends Error {
  public static fromTemplate(
    template: Omit<ProblemJson, 'detail'>,
    detail?: string | IPrismDiagnostic[],
  ): ProblemJsonError {
    const error = new ProblemJsonError(
      `https://stoplight.io/prism/errors#${template.type}`,
      template.title,
      template.status,
      detail || '',
    );
    Error.captureStackTrace(error, ProblemJsonError);

    return error;
  }

  public static asValidationIssue(error: Error & { detail: IPrismDiagnostic[]; status?: number }): any {
    return {
      ...sharedErrorProps(error),
      detail:
        'Your request body is not valid and no HTTP validation response was found in the spec, so Prism is generating this error for you.',
      validation: error.detail.map(detail => {
        const { path, code, message } = detail;

        return {
          location: path,
          severity: DiagnosticSeverity[detail.severity],
          code,
          message,
        };
      }),
    };
  }

  public static fromPlainError(error: Error & { detail?: string; status?: number }): ProblemJson {
    return {
      ...sharedErrorProps(error),
      detail: error.detail || '',
    };
  }

  constructor(
    readonly name: string,
    readonly message: string,
    readonly status: number,
    readonly detail: string | IPrismDiagnostic[],
  ) {
    super(message);
    Error.captureStackTrace(this, ProblemJsonError);
  }
}

export type ContentExample = INodeExample | INodeExternalExample;
export type NonEmptyArray<T> = T[] & { 0: T };
export type PayloadGenerator = (f: JSONSchema) => unknown;

export type PickRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

export type JSONSchema = JSONSchema4 | JSONSchema6 | JSONSchema7;
