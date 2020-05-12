import { IHttpContent, IHttpOperationResponse, IMediaTypeContent } from '@stoplight/types';
// @ts-ignore
import * as accepts from 'accepts';
import * as contentType from 'content-type';
import * as O from 'fp-ts/lib/Option';
import { filter, findFirst, head, sort } from 'fp-ts/lib/Array';
import { pick } from 'lodash';
import { NonEmptyArray, fromArray } from 'fp-ts/lib/NonEmptyArray';
import { alt, map, Option } from 'fp-ts/lib/Option';
import { ord, ordNumber } from 'fp-ts/lib/Ord';
import { pipe } from 'fp-ts/lib/pipeable';
import { ContentExample, PickRequired } from '../../';

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
  contents: IMediaTypeContent[],
  mediaTypes: string[]
): Option<IMediaTypeContent> {
  const bestType: string | false = accepts({ headers: { accept: mediaTypes.join(',') } }).type(
    contents.map(c => c.mediaType)
  );

  return pipe(
    bestType,
    O.fromPredicate((bestType): bestType is string => !!bestType),
    O.chain(bestType => findFirst<IMediaTypeContent>(content => content.mediaType === bestType)(contents)),
    O.alt(() =>
      // Since media type parameters are not standardised (apart from the quality value), we're going to try again ignoring them all but q.
      pipe(
        mediaTypes
          .map(mt => contentType.parse(mt))
          .filter(({ parameters }) => Object.keys(parameters).some(k => k !== 'q'))
          .map(({ type, parameters }) => ({ type, parameters: pick(parameters, 'q') }))
          .map(mt => contentType.format(mt)),
        fromArray,
        O.chain(mediaTypesWithNoParameters => findBestHttpContentByMediaType(contents, mediaTypesWithNoParameters))
      )
    )
  );
}

export function findDefaultContentType(
  response: PickRequired<IHttpOperationResponse, 'contents'>
): Option<IMediaTypeContent> {
  return pipe(
    response.contents,
    findFirst(content => content.mediaType === '*/*')
  );
}

const byResponseCode = ord.contramap<number, IHttpOperationResponse>(ordNumber, response => parseInt(response.code));

export function findLowest2xx(httpResponses: IHttpOperationResponse[]): Option<IHttpOperationResponse> {
  const generic2xxResponse = () =>
    pipe(
      findResponseByStatusCode(httpResponses, '2XX'),
      alt(() => createResponseFromDefault(httpResponses, '200'))
    );

  const first2xxResponse = pipe(
    httpResponses,
    filter(response => /2\d\d/.test(response.code)),
    sort(byResponseCode),
    head
  );

  return pipe(first2xxResponse, alt(generic2xxResponse));
}

export function findResponseByStatusCode(
  responses: IHttpOperationResponse[],
  statusCode: string
): Option<IHttpOperationResponse> {
  return pipe(
    responses,
    findFirst(response => response.code.toLowerCase() === statusCode.toLowerCase())
  );
}

export function createResponseFromDefault(
  responses: IHttpOperationResponse[],
  statusCode: string
): Option<IHttpOperationResponse> {
  return pipe(
    responses,
    findFirst(response => response.code === 'default'),
    map(response => Object.assign({}, response, { code: statusCode }))
  );
}

export function contentHasExamples(content: IMediaTypeContent): content is IWithExampleMediaContent {
  return !!content.examples && content.examples.length !== 0;
}
