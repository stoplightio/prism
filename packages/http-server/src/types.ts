import { IHttpConfig, PickRequired, TPrismHttpComponents, TPrismHttpInstance } from '@stoplight/prism-http';
import { FastifyInstance } from 'fastify';

export interface IPrismHttpServerOpts<LoaderInput> {
  components?: PickRequired<TPrismHttpComponents<LoaderInput>, 'logger'>;
  config: Partial<IHttpConfig>;
}

export interface IPrismHttpServer<LoaderInput> {
  readonly prism: TPrismHttpInstance<LoaderInput>;
  readonly fastify: FastifyInstance;
  listen: (port: number, address?: string, backlog?: number) => Promise<string>;
}
