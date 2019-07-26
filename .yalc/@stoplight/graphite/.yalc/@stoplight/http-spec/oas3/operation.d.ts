import { DeepPartial, IHttpOperation } from '@stoplight/types';
import { OpenAPIObject } from 'openapi3-ts';
import { Oas3HttpOperationTransformer } from '../oas/types';
export declare function computeOas3Operations(spec: DeepPartial<OpenAPIObject>): IHttpOperation[];
export declare const transformOas3Operation: Oas3HttpOperationTransformer;
