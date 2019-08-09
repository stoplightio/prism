import { DeepPartial, HttpSecurityScheme, IApiKeySecurityScheme, IBasicSecurityScheme, IOauth2SecurityScheme } from '@stoplight/types';
import { Security } from 'swagger-schema-official';
export declare function translateToSingleSecurity(security: DeepPartial<Security>): IBasicSecurityScheme | IApiKeySecurityScheme | IOauth2SecurityScheme | undefined;
export declare function translateToSecurities(securities: Array<DeepPartial<Security>>): HttpSecurityScheme[];
