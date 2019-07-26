import { IHttpHeaderParam, IMediaTypeContent } from '@stoplight/types';
import { HeaderObject, MediaTypeObject } from 'openapi3-ts';
export declare function translateHeaderObject(headerObject: HeaderObject, name: string): IHttpHeaderParam;
export declare function translateMediaTypeObject({ schema, example, examples, encoding }: MediaTypeObject, mediaType: string): IMediaTypeContent;
