import { IHttpConfig, TPrismHttpComponents, TPrismHttpInstance } from '@stoplight/prism-http';
import { FastifyInstance, ServerOptions } from 'fastify';

export interface IPrismHttpServerOpts<LoaderInput> {
  fastify?: ServerOptions;
  components?: TPrismHttpComponents<LoaderInput>;
  config: Partial<IHttpConfig>;
}

export interface IPrismHttpServer<LoaderInput> {
  readonly prism: TPrismHttpInstance<LoaderInput>;
  readonly fastify: FastifyInstance;
  listen: ListenFunc;
}

export type ListenFunc = (port: number, address?: string, backlog?: number) => Promise<string>;

export class ProblemJson extends Error {
  constructor(
    readonly name: string,
    readonly message: string,
    readonly status: number,
    readonly detail: string
  ) {
    super(message);
    Error.captureStackTrace(this, ProblemJson);
  }
}
