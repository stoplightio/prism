import { IHttpConfig, PickRequired, PrismHttpComponents, PrismHttpInstance } from '@stoplight/prism-http';
import { Server } from 'micri';
import { Logger } from 'pino';

export interface IPrismHttpServerOpts {
  components: PickRequired<Partial<PrismHttpComponents>, 'logger'>;
  config: IHttpConfig;
  cors: boolean;
}

export interface IPrismHttpServer {
  readonly prism: PrismHttpInstance;
  readonly logger: Logger;
  close: () => Promise<void>;
  listen: (port: number, address?: string, backlog?: number) => Promise<string>;
}

export type ThenArg<T> = T extends Promise<infer U> ? U : T extends (...args: any[]) => Promise<infer U> ? U : never;
