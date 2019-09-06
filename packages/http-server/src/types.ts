import { IHttpConfig, PickRequired, TPrismHttpComponents, TPrismHttpInstance } from '@stoplight/prism-http';
import { FastifyInstance } from 'fastify';

export interface IPrismHttpServerOpts {
  components?: PickRequired<TPrismHttpComponents, 'logger'>;
  config: IHttpConfig;
  cors: boolean;
}

export interface IPrismHttpServer {
  readonly prism: TPrismHttpInstance;
  readonly fastify: FastifyInstance;
  listen: (port: number, address?: string, backlog?: number) => Promise<string>;
}
