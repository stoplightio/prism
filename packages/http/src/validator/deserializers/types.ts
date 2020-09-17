import { JSONSchema } from '../../types';

export type deserializeFn<T> = (name: string, parameters: T, schema?: JSONSchema, explode?: boolean) => unknown;
