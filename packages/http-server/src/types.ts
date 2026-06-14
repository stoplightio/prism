import { IHttpConfig, PickRequired, PrismHttpComponents, PrismHttpInstance } from '@stoplight/prism-http';
import { Logger } from 'pino';

export interface ITlsOptions {
  key: Buffer | string;
  cert: Buffer | string;
  passphrase?: string;
  ca?: Buffer | string;
  requestCert?: boolean;
  rejectUnauthorized?: boolean;
  forwardClientCertHeaders?: boolean;
  http2?: boolean;
}

export interface IPrismHttpServerOpts {
  components: PickRequired<Partial<PrismHttpComponents>, 'logger'>;
  config: IHttpConfig;
  cors: boolean;
  tls?: ITlsOptions;
}

export interface IPrismHttpServer {
  readonly prism: PrismHttpInstance;
  readonly logger: Logger;
  close: () => Promise<void>;
  listen: (port: number, address?: string, backlog?: number) => Promise<string>;
}

export type ThenArg<T> =
  T extends Promise<infer U> ? U : T extends (...args: unknown[]) => Promise<infer U> ? U : never;
