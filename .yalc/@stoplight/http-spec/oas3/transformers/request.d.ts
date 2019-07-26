import { IHttpOperationRequest } from '@stoplight/types';
import { ParameterObject, RequestBodyObject } from 'openapi3-ts';
export declare function translateToRequest(parameters: ParameterObject[], requestBodyObject?: RequestBodyObject): IHttpOperationRequest;
