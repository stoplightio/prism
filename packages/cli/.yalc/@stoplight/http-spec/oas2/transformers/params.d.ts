import { IHttpHeaderParam, IHttpOperationRequestBody, IHttpPathParam, IHttpQueryParam } from '@stoplight/types';
import { BodyParameter, FormDataParameter, Header, HeaderParameter, PathParameter, QueryParameter } from 'swagger-schema-official';
export declare function translateToHeaderParam(parameter: HeaderParameter): IHttpHeaderParam;
export declare function translateToHeaderParams(headers: {
    [headerName: string]: Header;
}): IHttpHeaderParam[];
export declare function translateToBodyParameter(body: BodyParameter, consumes: string[]): IHttpOperationRequestBody;
export declare function translateFromFormDataParameters(parameters: FormDataParameter[], consumes: string[]): IHttpOperationRequestBody;
export declare function translateToQueryParameter(query: QueryParameter): IHttpQueryParam;
export declare function translateToPathParameter(parameter: PathParameter): IHttpPathParam;
