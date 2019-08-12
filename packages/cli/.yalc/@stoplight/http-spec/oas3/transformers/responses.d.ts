import { IHttpOperationResponse } from '@stoplight/types';
import { ResponsesObject } from 'openapi3-ts';
export declare function translateToResponses(responses: ResponsesObject): IHttpOperationResponse[] & {
    0: IHttpOperationResponse;
};
