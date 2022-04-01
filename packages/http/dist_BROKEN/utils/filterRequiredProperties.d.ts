import { JSONSchema7 } from 'json-schema';
import * as O from 'fp-ts/Option';
import { Option } from 'fp-ts/Option';
export declare const stripReadOnlyProperties: <B extends JSONSchema7>(schema: B) => O.Option<B>;
export declare const stripWriteOnlyProperties: <B extends JSONSchema7>(schema: B) => O.Option<B>;
