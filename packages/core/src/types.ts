import { IDiagnostic } from '@stoplight/types';
import { Either } from 'fp-ts/lib/Either';
import { Reader } from 'fp-ts/lib/Reader';
import { Logger } from 'pino';
export type IPrismDiagnostic = Omit<IDiagnostic, 'range'>;

// END

export interface IPrism<Resource, Input, Output, Config, LoadOpts> {
  process: (input: Input, config?: Config) => Promise<IPrismOutput<Input, Output>>;
  load: (opts?: LoadOpts) => Promise<void>;
  readonly resources: Resource[];
}

export type PartialPrismConfigFactory<C, I> = (
  input: I,
  defaultConfig?: PartialPrismConfig<C, I> | PrismConfig<C, I>,
) => Partial<C>;
export type PartialPrismConfig<C, I> = Partial<C> | PrismConfigFactory<C, I> | PartialPrismConfigFactory<C, I>;

export interface IPrismConfig {
  mock?: boolean | object;
  security?: boolean | object;
  validate?: boolean | object;
}

export type PrismConfigFactory<C, I> = (input: I, defaultConfig?: PrismConfig<C, I>) => C;
export type PrismConfig<C, I> = C | PrismConfigFactory<C, I>;

export interface ILoader<Options, Resource> {
  load: (opts?: Options, defaultLoader?: ILoader<Options, Resource>) => Promise<Resource[]>;
}

export interface IFilesystemLoaderOpts {
  path?: string;
}

export interface IHttpLoaderOpts {
  url?: string;
}

export interface IRouter<Resource, Input, Config> {
  route: (
    opts: { resources: Resource[]; input: Input; config?: Config },
    defaultRouter?: IRouter<Resource, Input, Config>,
  ) => Resource;
}

export interface IForwarder<Resource, Input, Config, Output> {
  forward: (
    opts: { resource?: Resource; input: IPrismInput<Input>; config?: Config },
    defaultForwarder?: IForwarder<Resource, Input, Config, Output>,
  ) => Promise<Output>;
}

export interface IMocker<Resource, Input, Config, Output> {
  mock: (
    opts: IMockerOpts<Resource, Input, Config>,
    defaultMocker?: IMocker<Resource, Input, Config, Output>,
  ) => Output;
}

export interface IMockerOpts<Resource, Input, Config> {
  resource: Resource;
  input: IPrismInput<Input>;
  config?: Config;
}

export interface IValidator<Resource, Input, Config, Output> {
  validateInput?: (
    opts: { resource: Resource; input: Input; config?: Config },
    defaultValidator?: IValidator<Resource, Input, Config, Output>,
  ) => Promise<IPrismDiagnostic[]>;
  validateOutput?: (
    opts: { resource: Resource; output?: Output; config?: Config },
    defaultValidator?: IValidator<Resource, Input, Config, Output>,
  ) => Promise<IPrismDiagnostic[]>;
}

export interface IPrismComponents<Resource, Input, Output, Config, LoadOpts> {
  loader: ILoader<LoadOpts, Resource>;
  router: IRouter<Resource, Input, Config>;
  forwarder: IForwarder<Resource, Input, Config, Output>;
  mocker: IMocker<Resource, Input, Config, Reader<Logger, Either<Error, Output>>>;
  validator: IValidator<Resource, Input, Config, Output>;
  logger: Logger;
}

export interface IPrismInput<I> {
  data: I;
  validations: {
    input: IPrismDiagnostic[];
  };
}

export interface IPrismOutput<I, O> {
  input?: I;
  output?: O;
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

export type PickRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

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
