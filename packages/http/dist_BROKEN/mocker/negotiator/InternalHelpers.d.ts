import { IHttpContent, IHttpOperationResponse, IMediaTypeContent } from '@stoplight/types';
import * as O from 'fp-ts/Option';
import * as NEA from 'fp-ts/NonEmptyArray';
import { ContentExample } from '../../';
export declare type IWithExampleMediaContent = IMediaTypeContent & {
    examples: NEA.NonEmptyArray<ContentExample>;
};
export declare function findFirstExample(httpContent: IHttpContent): O.Option<import("@stoplight/types").INodeExample | import("@stoplight/types").INodeExternalExample>;
export declare function findExampleByKey(httpContent: IHttpContent, exampleKey: string): O.Option<import("@stoplight/types").INodeExample | import("@stoplight/types").INodeExternalExample>;
export declare function findBestHttpContentByMediaType(contents: IMediaTypeContent[], mediaTypes: string[]): O.Option<IMediaTypeContent>;
export declare function findDefaultContentType(contents: IMediaTypeContent[]): O.Option<IMediaTypeContent>;
export declare function findLowest2xx(httpResponses: IHttpOperationResponse[]): O.Option<IHttpOperationResponse>;
export declare function findFirstResponse(httpResponses: IHttpOperationResponse[]): O.Option<IHttpOperationResponse>;
export declare function findResponseByStatusCode(responses: IHttpOperationResponse[], statusCode: number): O.Option<IHttpOperationResponse>;
export declare function createResponseFromDefault(responses: IHttpOperationResponse[], statusCode: number): O.Option<IHttpOperationResponse>;
export declare function contentHasExamples(content: IMediaTypeContent): content is IWithExampleMediaContent;
