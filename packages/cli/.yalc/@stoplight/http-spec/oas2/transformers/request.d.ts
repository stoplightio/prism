import { IHttpOperationRequest } from '@stoplight/types';
import { Parameter } from 'swagger-schema-official';
export declare function translateToRequest(parameters: Parameter[], consumes: string[]): IHttpOperationRequest;
