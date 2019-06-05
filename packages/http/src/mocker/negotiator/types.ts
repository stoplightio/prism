import { IHttpOperationConfig } from '@stoplight/prism-http';
import { IHttpHeaderParam, INodeExample, INodeExternalExample } from '@stoplight/types';
import { JSONSchema4, JSONSchema6, JSONSchema7 } from 'json-schema';

export interface IHttpNegotiationResult {
  code: string;
  mediaType: string;
  bodyExample?: INodeExample | INodeExternalExample;
  schema?: JSONSchema4 | JSONSchema6 | JSONSchema7;
  headers: IHttpHeaderParam[];
}

export type NegotiationOptions = IHttpOperationConfig;

export type NegotiatePartialOptions = {
  code: string;
  dynamic: boolean;
  exampleKey?: string;
};
