import { IDiagnostic } from '@stoplight/types';
import { Either } from 'fp-ts/lib/Either';
import { Reader } from 'fp-ts/lib/Reader';
import { Logger } from 'pino';
export type IPrismDiagnostic = Omit<IDiagnostic, 'range'>;

export interface IPrism<Resource, Input, Output, Config extends IPrismConfig> {
  process: (input: Input, resources: Resource[], config?: Config) => Promise<IPrismOutput<Input, Output>>;
}

export interface IPrismConfig {
  mock?: object;
  security?: boolean | object;
  validateRequest: boolean;
  validateResponse: boolean;
}

export interface IRouter<Resource, Input, Config extends IPrismConfig> {
  route: (opts: { resources: Resource[]; input: Input; config?: Config }) => Either<Error, Resource>;
}

export interface IMocker<Resource, Input, Config, Output> {
  mock: (opts: IMockerOpts<Resource, Input, Config>) => Output;
}

export interface IMockerOpts<Resource, Input, Config> {
  resource: Resource;
  input: IPrismInput<Input>;
  config?: Config;
}

export interface IValidator<Resource, Input, Output> {
  validateInput?: (opts: { resource: Resource; input: Input }) => IPrismDiagnostic[];
  validateOutput?: (opts: { resource: Resource; output: Output }) => IPrismDiagnostic[];
}

export type IPrismComponents<Resource, Input, Output, Config extends IPrismConfig> = {
  router: IRouter<Resource, Input, Config>;
  validator: IValidator<Resource, Input, Output>;
  mocker: IMocker<Resource, Input, Config, Reader<Logger, Either<Error, Output>>>;
  logger: Logger;
};

export interface IPrismInput<I> {
  data: I;
  validations: {
    input: IPrismDiagnostic[];
  };
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
