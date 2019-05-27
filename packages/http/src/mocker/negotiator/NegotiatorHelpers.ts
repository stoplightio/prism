import { IHttpContent, IHttpOperation, IHttpOperationResponse, IMediaTypeContent, Omit } from '@stoplight/types';
import pino from '../../logger';

import { ContentExample, NonEmptyArray } from '@stoplight/prism-http/src/types';
import { IHttpNegotiationResult, NegotiatePartialOptions, NegotiationOptions } from './types';

type IWithExampleMediaContent = IMediaTypeContent & { examples: NonEmptyArray<ContentExample> };

function findBestExample(httpContent: IHttpContent) {
  return httpContent.examples && httpContent.examples[0];
}

function findExampleByKey(httpContent: IHttpContent, exampleKey: string) {
  return httpContent.examples && httpContent.examples.find(example => example.key === exampleKey);
}

function findHttpContentByMediaType(
  response: IHttpOperationResponse,
  mediaType: string,
): IMediaTypeContent | undefined {
  return response.contents.find(content => content.mediaType === mediaType);
}

function findLowest2xx(httpResponses: IHttpOperationResponse[]): IHttpOperationResponse | undefined {
  const generic2xxResponse =
    findResponseByStatusCode(httpResponses, '2XX') || createResponseFromDefault(httpResponses, '200');
  const sorted2xxResponses = httpResponses
    .filter(response => response.code.match(/2\d\d/))
    .sort((a: IHttpOperationResponse, b: IHttpOperationResponse) => Number(a.code) - Number(b.code));

  return sorted2xxResponses[0] || generic2xxResponse;
}

function findResponseByStatusCode(
  responses: IHttpOperationResponse[],
  statusCode: string,
): IHttpOperationResponse | undefined {
  pino.info(`Looking for a ${statusCode} among the responses`);
  return responses.find(response => response.code.toLowerCase() === statusCode.toLowerCase());
}

function createResponseFromDefault(responses: IHttpOperationResponse[], statusCode: string) {
  pino.info(`Attempting to create a ${statusCode} using the default response`);
  const defaultResponse = responses.find(response => response.code === 'default');
  if (defaultResponse) {
    return Object.assign({}, defaultResponse, { code: statusCode });
  }
  return undefined;
}

function contentWithExamples(content: IMediaTypeContent): content is IWithExampleMediaContent {
  return !!content.examples && content.examples.length !== 0;
}

const helpers = {
  negotiateByPartialOptionsAndHttpContent(
    { code, exampleKey, dynamic }: NegotiatePartialOptions,
    httpContent: IMediaTypeContent,
  ): Omit<IHttpNegotiationResult, 'headers'> {
    const { mediaType } = httpContent;

    if (exampleKey) {
      // the user provided exampleKey - highest priority
      const example = findExampleByKey(httpContent, exampleKey);
      if (example) {
        // example exists, return
        return {
          code,
          mediaType,
          bodyExample: example,
        };
      } else {
        throw new Error(`Response for contentType: ${mediaType} and exampleKey: ${exampleKey} does not exist.`);
      }
    } else if (dynamic === true) {
      if (httpContent.schema) {
        return {
          code,
          mediaType,
          schema: httpContent.schema,
        };
      } else {
        throw new Error(`Tried to force a dynamic response for: ${mediaType} but schema is not defined.`);
      }
    } else {
      // try to find a static example first
      const example = findBestExample(httpContent);
      if (example) {
        // if example exists, return
        return {
          code,
          mediaType,
          bodyExample: example,
        };
      } else if (httpContent.schema) {
        return {
          code,
          mediaType,
          schema: httpContent.schema,
        };
      } else {
        return {
          code,
          mediaType,
        };
      }
    }
  },

  negotiateDefaultMediaType(
    partialOptions: NegotiatePartialOptions,
    response: IHttpOperationResponse,
  ): IHttpNegotiationResult {
    const { code, dynamic, exampleKey } = partialOptions;
    const mediaType = 'application/json';
    const httpContent = findHttpContentByMediaType(response, mediaType);
    if (httpContent) {
      // a httpContent for default mediaType exists
      const contentNegotiationResult = helpers.negotiateByPartialOptionsAndHttpContent(
        {
          code,
          dynamic,
          exampleKey,
        },
        httpContent,
      );
      return {
        headers: response.headers,
        ...contentNegotiationResult,
      };
    } else {
      // no httpContent found, returning empty body
      return {
        code,
        mediaType: 'text/plain',
        bodyExample: {
          value: undefined,
          key: 'default',
        },
        headers: response.headers,
      };
    }
  },

  negotiateOptionsBySpecificResponse(
    _httpOperation: IHttpOperation,
    desiredOptions: NegotiationOptions,
    response: IHttpOperationResponse,
  ): IHttpNegotiationResult {
    const { code, headers } = response;
    const { mediaType, dynamic, exampleKey } = desiredOptions;

    if (mediaType) {
      // a user provided mediaType
      const httpContent = findHttpContentByMediaType(response, mediaType);
      if (httpContent) {
        // a httpContent for a provided mediaType exists
        const contentNegotiationResult = helpers.negotiateByPartialOptionsAndHttpContent(
          {
            code,
            dynamic,
            exampleKey,
          },
          httpContent,
        );
        return {
          headers,
          ...contentNegotiationResult,
        };
      } else {
        return {
          code,
          mediaType: 'text/plain',
          headers,
        };
      }
    }
    // user did not provide mediaType
    // OR
    // a httpContent for a provided mediaType does not exist
    return helpers.negotiateDefaultMediaType(
      {
        code,
        dynamic,
        exampleKey,
      },
      response,
    );
  },

  negotiateOptionsForDefaultCode(
    httpOperation: IHttpOperation,
    desiredOptions: NegotiationOptions,
  ): IHttpNegotiationResult {
    const lowest2xxResponse = findLowest2xx(httpOperation.responses);
    if (lowest2xxResponse) {
      return helpers.negotiateOptionsBySpecificResponse(httpOperation, desiredOptions, lowest2xxResponse);
    }
    throw new Error('No 2** response defined, cannot mock');
  },

  negotiateOptionsBySpecificCode(
    httpOperation: IHttpOperation,
    desiredOptions: NegotiationOptions,
    code: string,
  ): IHttpNegotiationResult {
    // find response by provided status code
    const responseByForcedStatusCode =
      findResponseByStatusCode(httpOperation.responses, code) ||
      createResponseFromDefault(httpOperation.responses, code);
    if (responseByForcedStatusCode) {
      try {
        // try to negotiate
        return helpers.negotiateOptionsBySpecificResponse(httpOperation, desiredOptions, responseByForcedStatusCode);
      } catch (error) {
        // if negotiations fail try a default code
        try {
          return helpers.negotiateOptionsForDefaultCode(httpOperation, desiredOptions);
        } catch (error2) {
          throw new Error(`${error}. We tried default response, but we got ${error2}`);
        }
      }
    }
    // if no response found under a status code throw an error
    throw new Error('Requested status code is not defined in the schema.');
  },

  negotiateOptionsForValidRequest(
    httpOperation: IHttpOperation,
    desiredOptions: NegotiationOptions,
  ): IHttpNegotiationResult {
    const { code } = desiredOptions;
    if (code) {
      return helpers.negotiateOptionsBySpecificCode(httpOperation, desiredOptions, code);
    }
    return helpers.negotiateOptionsForDefaultCode(httpOperation, desiredOptions);
  },

  negotiateOptionsForInvalidRequest(httpResponses: IHttpOperationResponse[]): IHttpNegotiationResult {
    const response =
      findResponseByStatusCode(httpResponses, '422') ||
      findResponseByStatusCode(httpResponses, '400') ||
      createResponseFromDefault(httpResponses, '422');
    if (!response) {
      throw new Error('No 422, 400, or default responses defined');
    }
    // find first response with any static examples
    const responseWithExamples = response.contents.find<IWithExampleMediaContent>(contentWithExamples);

    if (responseWithExamples) {
      return {
        code: response.code,
        mediaType: responseWithExamples.mediaType,
        bodyExample: responseWithExamples.examples[0],
        headers: response.headers,
      };
    } else {
      pino.info(`Coudlnt\'t find a content with an example defined for the response ${response.code}`);
      // find first response with a schema
      const responseWithSchema = response.contents.find(content => !!content.schema);
      if (responseWithSchema)
        return {
          code: response.code,
          mediaType: responseWithSchema.mediaType,
          schema: responseWithSchema.schema,
          headers: response.headers,
        };
      else {
        pino.info(`Couldn\' t find a content with a schema defined for the response ${response.code}`);
        throw new Error(
          `Request invalid but mock data corrupted. Neither schema nor example defined for ${response.code} response.`,
        );
      }
    }
  },
};

export default helpers;
