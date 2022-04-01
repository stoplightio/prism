import { IHttpHeaderParam } from '@stoplight/types';
import { ContentExample } from '../../';
import { IHttpOperationConfig, JSONSchema } from '../../';
export interface IHttpNegotiationResult {
    code: string;
    mediaType?: string;
    bodyExample?: ContentExample;
    headers: IHttpHeaderParam[];
    schema?: JSONSchema;
    deprecated?: boolean;
}
export declare type NegotiationOptions = IHttpOperationConfig;
export declare type NegotiatePartialOptions = {
    code: string;
    dynamic: boolean;
    exampleKey?: string;
};
