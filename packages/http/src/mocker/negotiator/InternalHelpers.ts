import { IHttpContent, IHttpOperationResponse, IMediaTypeContent } from '@stoplight/types';
// @ts-ignore
import * as accepts from 'accepts';
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
): IMediaTypeContent | undefined {
  const bestType = accepts({
    headers: {
      accept: mediaType.join(','),
    },
  }).type(response.contents.map(c => c.mediaType));

  return response.contents.find(content => content.mediaType === bestType);
}

export function findDefaultContentType(
  response: PickRequired<IHttpOperationResponse, 'contents'>,
): IMediaTypeContent | undefined {
  return response.contents.find(content => content.mediaType === '*/*');
}

export function findLowest2xx(httpResponses: IHttpOperationResponse[]): IHttpOperationResponse | undefined {
  const generic2xxResponse =
    findResponseByStatusCode(httpResponses, '2XX') || createResponseFromDefault(httpResponses, '200');
  const sorted2xxResponses = httpResponses
    .filter(response => response.code.match(/2\d\d/))
    .sort((a: IHttpOperationResponse, b: IHttpOperationResponse) => Number(a.code) - Number(b.code));

  return sorted2xxResponses[0] || generic2xxResponse;
}

export function findResponseByStatusCode(
  responses: IHttpOperationResponse[],
  statusCode: string,
): IHttpOperationResponse | undefined {
  return responses.find(response => response.code.toLowerCase() === statusCode.toLowerCase());
}

export function createResponseFromDefault(
  responses: IHttpOperationResponse[],
  statusCode: string,
): IHttpOperationResponse | undefined {
  const defaultResponse = responses.find(response => response.code === 'default');
  if (defaultResponse) {
    return Object.assign({}, defaultResponse, { code: statusCode });
  }
  return undefined;
}

export function contentHasExamples(content: IMediaTypeContent): content is IWithExampleMediaContent {
  return !!content.examples && content.examples.length !== 0;
}
