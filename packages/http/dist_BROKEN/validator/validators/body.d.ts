import { Dictionary, IHttpEncoding, IMediaTypeContent } from '@stoplight/types';
import * as O from 'fp-ts/Option';
import { JSONSchema } from '../../types';
import { validateFn } from './types';
export declare function deserializeFormBody(schema: JSONSchema, encodings: IHttpEncoding[], decodedUriParams: Dictionary<string>): Dictionary<string, string>;
export declare function splitUriParams(target: string): Dictionary<string, string>;
export declare function decodeUriEntities(target: Dictionary<string>): {};
export declare function findContentByMediaTypeOrFirst(specs: IMediaTypeContent[], mediaType: string): O.Option<{
    mediaType: string;
    content: IMediaTypeContent;
}>;
export declare const validate: validateFn<unknown, IMediaTypeContent>;
