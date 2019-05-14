import { INodeExample, INodeExternalExample, ISchema } from '@stoplight/types';
import { IHttpOperationConfig } from 'http/src/types';

export interface IHttpNegotiationResult {
  code: string;
  mediaType: string;
  example?: INodeExample | INodeExternalExample;
  schema?: ISchema;
}

export type NegotiationOptions = IHttpOperationConfig;

export type NegotiatePartialOptions = {
  code: string;
  dynamic: boolean;
  exampleKey?: string;
};
