import { IHttpContent, IHttpOperation, IHttpOperationResponse } from '@stoplight/types';

import { IHttpNegotiationResult } from './types';

function findBestExample(httpContent: IHttpContent) {
  return httpContent.examples && httpContent.examples[0];
}

function findExampleByKey(httpContent: IHttpContent, exampleKey: string) {
  return httpContent.examples && httpContent.examples.find(example => example.key === exampleKey);
}

function findHttpContentByMediaType(
  response: IHttpOperationResponse,
  mediaType: string
): IHttpContent | undefined {
  return response.contents.find(content => content.mediaType === mediaType);
}

function findLowest2xx(
  httpResponses: IHttpOperationResponse[]
): IHttpOperationResponse | undefined {
  const generic2xxResponse = findResponseByStatusCode(httpResponses, '2XX');
  const sorted2xxResponses = httpResponses
    .filter(response => response.code.match(/2\d\d/))
    .sort(
      (a: IHttpOperationResponse, b: IHttpOperationResponse) => Number(a.code) - Number(b.code)
    );

  return sorted2xxResponses[0] || generic2xxResponse;
}

function findResponseByStatusCode(
  responses: IHttpOperationResponse[],
  statusCode: string
): IHttpOperationResponse | undefined {
  return responses.find(response => response.code.toLowerCase() === statusCode.toLowerCase());
}

const helpers = {
  negotiateByPartialOptionsAndHttpContent(
    {
      code,
      exampleKey,
      dynamic,
    }: {
      readonly code: string;
      readonly dynamic?: boolean;
      readonly exampleKey?: string;
    },
    httpContent: IHttpContent
  ): IHttpNegotiationResult {
    const { mediaType } = httpContent;

    if (exampleKey) {
      // the user provided exampleKey - highest priority
      const example = findExampleByKey(httpContent, exampleKey);
      if (example) {
        // example exists, return
        return {
          code,
          mediaType,
          example,
        };
      } else {
        throw new Error(
          `Response for contentType: ${mediaType} and exampleKey: ${exampleKey} does not exist.`
        );
      }
    } else if (dynamic === true) {
      if (httpContent.schema) {
        return {
          code,
          mediaType,
          schema: httpContent.schema,
        };
      } else {
        throw new Error(
          `Tried to force a dynamic response for: ${mediaType} but schema is not defined.`
        );
      }
    } else {
      // try to find a static example first
      const example = findBestExample(httpContent);
      if (example) {
        // if example exists, return
        return {
          code,
          mediaType,
          example,
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
    partialOptions: {
      readonly code: string;
      readonly dynamic?: boolean;
      readonly exampleKey?: string;
    },
    response: IHttpOperationResponse
  ): IHttpNegotiationResult {
    const { code, dynamic, exampleKey } = partialOptions;
    const mediaType = 'application/json';
    const httpContent = findHttpContentByMediaType(response, mediaType);
    if (httpContent) {
      // a httpContent for default mediaType exists
      return helpers.negotiateByPartialOptionsAndHttpContent(
        {
          code,
          dynamic,
          exampleKey,
        },
        httpContent
      );
    }
    // a httpContent for default mediaType does not exist
    throw new Error(
      'Could not generate response for provided content type or no content type provided. Tried to fallback to application/json, but no definition found.'
    );
  },

  negotiateOptionsBySpecificResponse(
    _httpOperation: IHttpOperation,
    desiredOptions: {
      readonly mediaType?: string;
      readonly code?: string;
      readonly exampleKey?: string;
      readonly dynamic?: boolean;
    },
    response: IHttpOperationResponse
  ): IHttpNegotiationResult {
    const { code } = response;
    const { mediaType, dynamic, exampleKey } = desiredOptions;

    if (mediaType) {
      // a user provided mediaType
      const httpContent = findHttpContentByMediaType(response, mediaType);
      if (httpContent) {
        // a httpContent for a provided mediaType exists
        return helpers.negotiateByPartialOptionsAndHttpContent(
          {
            code,
            dynamic,
            exampleKey,
          },
          httpContent
        );
      } else {
        throw new Error('Requested content type is not defined in the schema');
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
      response
    );
  },

  negotiateOptionsForDefaultCode(
    httpOperation: IHttpOperation,
    desiredOptions: {
      readonly mediaType?: string;
      readonly code?: string;
      readonly exampleKey?: string;
      readonly dynamic?: boolean;
    }
  ): IHttpNegotiationResult {
    const lowest2xxResponse = findLowest2xx(httpOperation.responses);
    if (lowest2xxResponse) {
      return helpers.negotiateOptionsBySpecificResponse(
        httpOperation,
        desiredOptions,
        lowest2xxResponse
      );
    }
    throw new Error('No 2** response defined, cannot mock');
  },

  negotiateOptionsBySpecificCode(
    httpOperation: IHttpOperation,
    desiredOptions: {
      readonly mediaType?: string;
      readonly code?: string;
      readonly exampleKey?: string;
      readonly dynamic?: boolean;
    },
    code: string
  ): IHttpNegotiationResult {
    // find response by provided status code
    const responseByForcedStatusCode = findResponseByStatusCode(httpOperation.responses, code);
    if (responseByForcedStatusCode) {
      try {
        // try to negotiate
        return helpers.negotiateOptionsBySpecificResponse(
          httpOperation,
          desiredOptions,
          responseByForcedStatusCode
        );
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
    desiredOptions: {
      readonly mediaType?: string;
      readonly code?: string;
      readonly exampleKey?: string;
      readonly dynamic?: boolean;
    }
  ): IHttpNegotiationResult {
    const { code } = desiredOptions;
    if (code) {
      return helpers.negotiateOptionsBySpecificCode(httpOperation, desiredOptions, code);
    }
    return helpers.negotiateOptionsForDefaultCode(httpOperation, desiredOptions);
  },

  negotiateOptionsForInvalidRequest(
    httpResponses: IHttpOperationResponse[]
  ): IHttpNegotiationResult {
    // currently only try to find a 400 response, but we may want to support other cases in the future
    const code = '400';
    const response = findResponseByStatusCode(httpResponses, code);
    // TODO: what if no 400 response is defined?
    if (!response) {
      throw new Error('No 400 response defined');
    }
    // find first response with any static examples
    const responseWithExamples = response.contents.find(
      content => !!content.examples && content.examples.length !== 0
    );
    // find first response with a schema
    const responseWithSchema = response.contents.find(content => !!content.schema);

    if (responseWithExamples) {
      return {
        code,
        mediaType: responseWithExamples.mediaType,
        example: responseWithExamples.examples![0],
      };
    } else if (responseWithSchema) {
      return {
        code,
        mediaType: responseWithSchema.mediaType,
        schema: responseWithSchema.schema,
      };
    } else {
      throw new Error(
        'Request invalid but mock data corrupted. Neither schema nor example defined for 400 response.'
      );
    }
  },
};

export default helpers;
