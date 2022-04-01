import { IHttpNameValues } from '../../../types';
export declare function createDelimitedDeserializerStyle(separator: string): (name: string, parameters: IHttpNameValues, schema?: import("json-schema").JSONSchema7 | undefined, explode?: boolean) => "" | string[];
