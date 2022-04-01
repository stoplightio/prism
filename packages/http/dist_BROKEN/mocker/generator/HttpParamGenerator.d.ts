import { IHttpContent, IHttpParam } from '@stoplight/types';
import * as O from 'fp-ts/Option';
import { JSONSchema } from '../../types';
export declare function improveSchema(schema: JSONSchema): JSONSchema;
export declare function generate(param: IHttpParam | IHttpContent): O.Option<unknown>;
