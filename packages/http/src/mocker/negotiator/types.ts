import { IHttpOperationConfig, JSONSchema } from '@stoplight/prism-http';
import { ContentExample } from '@stoplight/prism-http/src/types';
import { IHttpHeaderParam } from '@stoplight/types';

export interface IHttpNegotiationResult {
  code: string;
  mediaType: string;
  bodyExample?: ContentExample;
  headers: IHttpHeaderParam[];
  schema?: JSONSchema;
}

export type NegotiationOptions = IHttpOperationConfig;

export type NegotiatePartialOptions = {
  code: string;
  dynamic: boolean;
  exampleKey?: string;
};
