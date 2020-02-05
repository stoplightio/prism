import { IDiagnostic } from '@stoplight/types';
import { Either } from 'fp-ts/lib/Either';
import { ReaderEither } from 'fp-ts/lib/ReaderEither';
import { ReaderTaskEither } from 'fp-ts/lib/ReaderTaskEither';
import { TaskEither } from 'fp-ts/lib/TaskEither';
import { Logger } from 'pino';
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
export type IPrismDiagnostic = Omit<IDiagnostic, 'range' | 'path'> & { path?: string[] };

export interface IPrism<Resource, Input, Output, Config extends IPrismConfig> {
  request: (input: Input, resources: Resource[], config?: Config) => TaskEither<Error, IPrismOutput<Output>>;
}

export interface IPrismConfig {
  mock: false | unknown;
  checkSecurity: boolean;
  validateRequest: boolean;
  validateResponse: boolean;
  errors: boolean;
}

export type ValidatorFn<R, E> = (opts: { resource: R; element: E }) => Either<NonEmptyArray<IPrismDiagnostic>, E>;

export type IPrismProxyConfig = IPrismConfig & {
  mock: false;
  upstream: URL;
};

export type IPrismComponents<Resource, Input, Output, Config extends IPrismConfig> = {
  route: (opts: { resources: Resource[]; input: Input }) => Either<Error, Resource>;
  validateInput: ValidatorFn<Resource, Input>;
  validateSecurity: ValidatorFn<Resource, Input>;
  validateOutput: ValidatorFn<Resource, Output>;
  forward: (input: Input, baseUrl: string) => ReaderTaskEither<Logger, Error, Output>;
  mock: (opts: {
    resource: Resource;
    input: IPrismInput<Input>;
    config: Config['mock'];
  }) => ReaderEither<Logger, Error, Output>;
  logger: Logger;
};

export interface IPrismInput<I> {
  data: I;
  validations: IPrismDiagnostic[];
}

export interface IPrismOutput<O> {
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
      detail || ''
    );

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
  }
}
