import { IDiagnostic } from '@stoplight/types';
import { IHttpResponse } from "@stoplight/types";
import { IHttpOperationRequest, IHttpOperationResponse } from "@stoplight/types/dist";
import { Either } from 'fp-ts/lib/Either';
import { ReaderEither } from 'fp-ts/lib/ReaderEither';
import { TaskEither } from 'fp-ts/lib/TaskEither';
import { Logger } from 'pino';
import { Option } from 'fp-ts/lib/Option'

export type IPrismDiagnostic = Omit<IDiagnostic, 'range'>;

export interface IPrism<Resource, Input, Output, Config extends IPrismConfig> {
  request: (input: Input, resources: Resource[], config?: Config) => Promise<IPrismOutput<Input, Output>>;
}

export interface IPrismConfig {
  mock: false | unknown;
  checkSecurity: boolean;
  validateRequest: boolean;
  validateResponse: boolean;
}

export type ValidatorFn<Resource, T> = (opts: { resource?: Resource; element: T }) => IPrismDiagnostic[];

export type IPrismComponents<Resource, Input, Output, Config extends IPrismConfig> = {
  route: (opts: { resources: Resource[]; input: Input }) => Either<Error, Resource>;
  validateInput: ValidatorFn<Resource, Input>;
  validateOutput: ValidatorFn<Resource, Output>;
  deserializeInput: (input: Input, request: IHttpOperationRequest) => {
    bSchema: any,
    hSchema: any,
    qSchema: any,
    deserializedBody: any,
    deserializedHeaders: any,
    deserializedQuery: any,
    mediaType: string,
    content: any
  };
  findOperationResponse: (responseSpecs: IHttpOperationResponse[], statusCode: number) => Option<IHttpOperationResponse>; // might move findOperationResponse to the core
  deserializeOutput: (output: Output, response: IHttpResponse<any>) => {
    bSchema: any,
    hSchema: any,
    deserializedBody: any,
    deserializedHeaders: any,
    mediaType: string,
    content: any
  };
  forward: (resource: Resource, input: Input) => TaskEither<Error, Output>;
  mock: (
    opts: {
      resource: Resource;
      input: IPrismInput<Input>;
      config: Config['mock'];
    },
  ) => ReaderEither<Logger, Error, Output>;
  logger: Logger;
};

export interface IPrismInput<I> {
  data: I;
  validations: IPrismDiagnostic[];
}

export interface IPrismOutput<I, O> {
  input: I;
  output: O;
  validations: {
    input: IPrismDiagnostic[];
    output: IPrismDiagnostic[];
  };
}

export type ProblemJson = {
  type: string;
  title: string;
  status: number;
  detail: string;
};

export class ProblemJsonError extends Error {
  public static fromTemplate(template: Omit<ProblemJson, 'detail'>, detail?: string): ProblemJsonError {
    const error = new ProblemJsonError(
      `https://stoplight.io/prism/errors#${template.type}`,
      template.title,
      template.status,
      detail || '',
    );
    Error.captureStackTrace(error, ProblemJsonError);

    return error;
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
