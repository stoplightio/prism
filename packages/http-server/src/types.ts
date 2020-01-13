import { IHttpConfig, PickRequired, PrismHttpComponents, PrismHttpInstance } from '@stoplight/prism-http';
import { Server } from 'micri';
import { Logger } from 'pino';

export interface IPrismHttpServerOpts {
  components: PickRequired<Partial<PrismHttpComponents>, 'logger'>;
  config: IHttpConfig;
  cors: boolean;
  errors: boolean;
}

export interface IPrismHttpServer {
  readonly prism: PrismHttpInstance;
  readonly micri: Server;
  readonly logger: Logger;
  listen: (port: number, address?: string, backlog?: number) => Promise<string>;
}
