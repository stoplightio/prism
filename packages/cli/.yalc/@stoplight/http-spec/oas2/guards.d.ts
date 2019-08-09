import { BodyParameter, FormDataParameter, HeaderParameter, Parameter, PathParameter, QueryParameter } from 'swagger-schema-official';
export declare function isBodyParameter(parameter: Parameter): parameter is BodyParameter;
export declare function isFormDataParameter(parameter: Parameter): parameter is FormDataParameter;
export declare function isQueryParameter(parameter: Parameter): parameter is QueryParameter;
export declare function isPathParameter(parameter: Parameter): parameter is PathParameter;
export declare function isHeaderParameter(parameter: Parameter): parameter is HeaderParameter;
