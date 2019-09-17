import { IHttpContent, IHttpOperationResponse, IMediaTypeContent } from '@stoplight/types';
// @ts-ignore
import * as accepts from 'accepts';
import { filter, findFirst, head, sort } from 'fp-ts/lib/Array';
import { alt, map, Option } from 'fp-ts/lib/Option';
import { ord, ordNumber } from 'fp-ts/lib/Ord';
import { pipe } from 'fp-ts/lib/pipeable';
import { ContentExample, NonEmptyArray, PickRequired } from '../../';

export type IWithExampleMediaContent = IMediaTypeContent & { examples: NonEmptyArray<ContentExample> };

export function findBestExample(httpContent: IHttpContent) {
  return httpContent.examples && httpContent.examples[0];
}

export function findExampleByKey(httpContent: IHttpContent, exampleKey: string) {
  return httpContent.examples && httpContent.examples.find(example => example.key === exampleKey);
}

export function hasContents(v: IHttpOperationResponse): v is PickRequired<IHttpOperationResponse, 'contents'> {
  return !!v.contents;
}

export function findBestHttpContentByMediaType(
  response: PickRequired<IHttpOperationResponse, 'contents'>,
  mediaType: string[],
): Option<IMediaTypeContent> {
  const bestType = accepts({
    headers: {
      accept: mediaType.join(','),
    },
  }).type(response.contents.map(c => c.mediaType));

  return pipe(
    response.contents,
    findFirst(content => content.mediaType === bestType),
  );
}

export function findDefaultContentType(
  response: PickRequired<IHttpOperationResponse, 'contents'>,
): Option<IMediaTypeContent> {
  return pipe(
    response.contents,
    findFirst(content => content.mediaType === '*/*'),
  );
}

const byResponseCode = ord.contramap<number, IHttpOperationResponse>(ordNumber, response => parseInt(response.code));

export function findLowest2xx(httpResponses: IHttpOperationResponse[]): Option<IHttpOperationResponse> {
  const generic2xxResponse = () =>
    pipe(
      findResponseByStatusCode(httpResponses, '2XX'),
      alt(() => createResponseFromDefault(httpResponses, '200')),
    );

  const first2xxResponse = pipe(
    httpResponses,
    filter(response => /2\d\d/.test(response.code)),
    sort(byResponseCode),
    head,
  );

  return pipe(
    first2xxResponse,
    alt(generic2xxResponse),
  );
}

export function findResponseByStatusCode(
  responses: IHttpOperationResponse[],
  statusCode: string,
): Option<IHttpOperationResponse> {
  return pipe(
    responses,
    findFirst(response => response.code.toLowerCase() === statusCode.toLowerCase()),
  );
}

export function createResponseFromDefault(
  responses: IHttpOperationResponse[],
  statusCode: string,
): Option<IHttpOperationResponse> {
  return pipe(
    responses,
    findFirst(response => response.code === 'default'),
    map(response => Object.assign({}, response, { code: statusCode })),
  );
}

export function contentHasExamples(content: IMediaTypeContent): content is IWithExampleMediaContent {
  return !!content.examples && content.examples.length !== 0;
}
