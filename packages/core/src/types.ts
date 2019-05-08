import { IDiagnostic, Omit } from '@stoplight/types';
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
    opts: Partial<IMockerOpts<Resource, Input, Config>>,
    defaultMocker?: IMocker<Resource, Input, Config, Output>,
  ) => Promise<Output>;
}

export interface IMockerOpts<Resource, Input, Config> {
  resource: Resource;
  input: IPrismInput<Input>;
  config: Config;
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
  mocker: IMocker<Resource, Input, Config, Output>;
  validator: IValidator<Resource, Input, Config, Output>;
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
