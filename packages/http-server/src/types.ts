import { IHttpConfig, PickRequired, PrismHttpComponents, PrismHttpInstance } from '@stoplight/prism-http';
import { Server } from 'micri';

export interface IPrismHttpServerOpts {
  components: PickRequired<Partial<PrismHttpComponents>, 'logger'>;
  config: IHttpConfig;
  cors: boolean;
  errors: boolean;
}

export interface IPrismHttpServer {
  readonly prism: PrismHttpInstance;
  readonly server: Server;
  listen: (port: number, address?: string, backlog?: number) => Promise<string>;
}
