import { DeepPartial, IHttpOperation } from '@stoplight/types';
import { Spec } from 'swagger-schema-official';
import { Oas2HttpOperationTransformer } from '../oas/types';
export declare function computeOas2Operations(spec: DeepPartial<Spec>): IHttpOperation[];
export declare const transformOas2Operation: Oas2HttpOperationTransformer;
