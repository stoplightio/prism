import { IHttpContent, IHttpOperationResponse, IMediaTypeContent } from '@stoplight/types';
// @ts-ignore
import * as accepts from 'accepts';
import * as contentType from 'content-type';
import * as O from 'fp-ts/Option';
import * as A from 'fp-ts/Array';
import { pick } from 'lodash';
import * as NEA from 'fp-ts/NonEmptyArray';
import { ord, ordNumber } from 'fp-ts/Ord';
import { pipe } from 'fp-ts/function';
import { ContentExample } from '../../';

export type IWithExampleMediaContent = IMediaTypeContent & { examples: NEA.NonEmptyArray<ContentExample> };

export function findFirstExample(httpContent: IHttpContent) {
  return pipe(O.fromNullable(httpContent.examples), O.chain(NEA.fromArray), O.chain(A.head));
}

export function findExampleByKey(httpContent: IHttpContent, exampleKey: string) {
  return pipe(O.fromNullable(httpContent.examples), O.chain(A.findFirst(({ key }) => key === exampleKey)));
}

export function findBestHttpContentByMediaType(
  contents: IMediaTypeContent[],
  mediaTypes: string[]
): O.Option<IMediaTypeContent> {
  const bestType: string | false = accepts({ headers: { accept: mediaTypes.join(',') } }).type(
    contents.map(c => c.mediaType)
  );

  return pipe(
    bestType,
    O.fromPredicate((bestType): bestType is string => !!bestType),
    O.chain(bestType => A.findFirst<IMediaTypeContent>(content => content.mediaType === bestType)(contents)),
    O.alt(() =>
      // Since media type parameters are not standardised (apart from the quality value), we're going to try again ignoring them all but q.
      pipe(
        mediaTypes
          .map(mt => contentType.parse(mt))
          .filter(({ parameters }) => Object.keys(parameters).some(k => k !== 'q'))
          .map(({ type, parameters }) => ({ type, parameters: pick(parameters, 'q') }))
          .map(mt => contentType.format(mt)),
        NEA.fromArray,
        O.chain(mediaTypesWithNoParameters => findBestHttpContentByMediaType(contents, mediaTypesWithNoParameters))
      )
    )
  );
}

export function findDefaultContentType(contents: IMediaTypeContent[]): O.Option<IMediaTypeContent> {
  return pipe(
    contents,
    A.findFirst(content => content.mediaType === '*/*')
  );
}

const byResponseCode = ord.contramap<number, IHttpOperationResponse>(ordNumber, response => parseInt(response.code));

export function findLowest2xx(httpResponses: IHttpOperationResponse[]): O.Option<IHttpOperationResponse> {
  const first2xxResponse = pipe(
    httpResponses,
    A.filter(response => /2\d\d/.test(response.code)),
    A.sort(byResponseCode),
    A.head
  );

  return pipe(
    first2xxResponse,
    O.alt(() => createResponseFromDefault(httpResponses, 200))
  );
}

export function findFirstResponse(httpResponses: IHttpOperationResponse[]): O.Option<IHttpOperationResponse> {
  return pipe(httpResponses, A.head);
}

export function findResponseByStatusCode(
  responses: IHttpOperationResponse[],
  statusCode: number
): O.Option<IHttpOperationResponse> {
  return pipe(
    responses,
    A.findFirst(response => response.code.toLowerCase() === String(statusCode))
  );
}

export function createResponseFromDefault(
  responses: IHttpOperationResponse[],
  statusCode: number
): O.Option<IHttpOperationResponse> {
  return pipe(
    responses,
    A.findFirst(response => response.code === 'default'),
    O.map(response => Object.assign({}, response, { code: statusCode }))
  );
}

export function contentHasExamples(content: IMediaTypeContent): content is IWithExampleMediaContent {
  return !!content.examples && content.examples.length !== 0;
}
