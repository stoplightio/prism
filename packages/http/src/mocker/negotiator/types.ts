import { IHttpOperationConfig } from '@stoplight/prism-http';
import { ContentExample } from '@stoplight/prism-http/src/types';
import { IHttpHeaderParam, ISchema } from '@stoplight/types';

export interface IHttpNegotiationResult {
  code: string;
  mediaType: string;
  bodyExample?: ContentExample;
  schema?: ISchema;
  headers: IHttpHeaderParam[];
}

export type NegotiationOptions = IHttpOperationConfig;

export type NegotiatePartialOptions = {
  code: string;
  dynamic: boolean;
  exampleKey?: string;
};
