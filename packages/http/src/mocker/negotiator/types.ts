import { IHttpOperationConfig } from '@stoplight/prism-http';
import { IHttpHeaderParam, INodeExample, INodeExternalExample, ISchema } from '@stoplight/types';

export interface IHttpNegotiationResult {
  code: string;
  mediaType: string;
  bodyExample?: INodeExample | INodeExternalExample;
  schema?: ISchema;
  headers: IHttpHeaderParam[];
}

export type NegotiationOptions = IHttpOperationConfig;

export type NegotiatePartialOptions = {
  code: string;
  dynamic: boolean;
  exampleKey?: string;
};
