import { DeepPartial, HttpSecurityScheme } from '@stoplight/types';
import { SecuritySchemeObject } from 'openapi3-ts';
export declare function translateToSecurities(securities: SecuritySchemeObject[]): HttpSecurityScheme[];
export declare function transformToSingleSecurity(securityScheme: DeepPartial<SecuritySchemeObject>): HttpSecurityScheme;
