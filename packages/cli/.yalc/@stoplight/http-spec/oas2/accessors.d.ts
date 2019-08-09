import { Dictionary } from '@stoplight/types';
import { Operation, Security, Spec } from 'swagger-schema-official';
export declare function getSecurities(spec: Partial<Spec>, operationSecurity: Array<Dictionary<string[], string>> | undefined): Security[];
export declare function getProduces(spec: Partial<Spec>, operation: Partial<Operation>): string[];
export declare function getConsumes(spec: Partial<Spec>, operation: Partial<Operation>): string[];
