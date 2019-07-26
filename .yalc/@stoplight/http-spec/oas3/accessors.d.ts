import { OpenAPIObject, OperationObject, SecuritySchemeObject } from 'openapi3-ts';
export declare function getSecurities(spec: Partial<OpenAPIObject>, operation: Partial<OperationObject>): SecuritySchemeObject[];
