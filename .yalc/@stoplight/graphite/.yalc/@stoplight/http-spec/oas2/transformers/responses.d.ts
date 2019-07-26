import { IHttpOperationResponse } from '@stoplight/types';
import { Response } from 'swagger-schema-official';
export declare function translateToResponses(responses: {
    [name: string]: Response;
}, produces: string[]): IHttpOperationResponse[] & {
    0: IHttpOperationResponse;
};
