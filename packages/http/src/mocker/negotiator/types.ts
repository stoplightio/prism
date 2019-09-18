import { IHttpHeaderParam } from '@stoplight/types';
import { ContentExample } from '../../';
import { IHttpOperationConfig, JSONSchema } from '../../';

export interface IHttpNegotiationResult {
  code: string;
  mediaType?: string;
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
