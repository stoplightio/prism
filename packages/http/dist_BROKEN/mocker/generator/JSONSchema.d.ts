import { JSONSchema } from '../../types';
import { Either } from 'fp-ts/Either';
import { IHttpOperation } from '@stoplight/types';
export declare function generate(bundle: unknown, source: JSONSchema): Either<Error, unknown>;
export declare function generateStatic(resource: IHttpOperation, source: JSONSchema): Either<Error, unknown>;
