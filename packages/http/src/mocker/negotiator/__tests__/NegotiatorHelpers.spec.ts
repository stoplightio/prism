import {
  IHttpOperation,
  IHttpOperationResponse,
  IMediaTypeContent,
  INodeExample,
  INodeExternalExample,
  Omit,
} from '@stoplight/types';
import { Chance } from 'chance';

import helpers from '../NegotiatorHelpers';
import { IHttpNegotiationResult } from '../types';

const chance = new Chance();

function anHttpOperation(givenHttpOperation?: IHttpOperation) {
  const httpOperation = givenHttpOperation || {
    method: chance.string(),
    path: chance.url(),
    responses: [],
    id: chance.string(),
    servers: [],
    security: [],
    request: { query: [], path: [], cookie: [], headers: [] },
  };
  return {
    instance() {
      return httpOperation;
    },
    withResponses(responses: IHttpOperationResponse[]) {
      httpOperation.responses = responses;
      return this;
    },
  };
}

describe('NegotiatorHelpers', () => {
  let httpOperation: IHttpOperation;

  beforeEach(() => {
    httpOperation = anHttpOperation().instance();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('negotiateOptionsForInvalidRequest()', () => {
    describe('and 422 response exists', () => {
      const actualCode = '422';
      const actualMediaType = chance.string();
      const actualExampleKey = chance.string();

      test('and has static examples defined should return the first static example', () => {
        httpOperation = anHttpOperation(httpOperation)
          .withResponses([
            {
              code: actualCode,
              headers: [],
              contents: [
                {
                  mediaType: actualMediaType,
                  examples: [
                    { key: actualExampleKey, value: '', externalValue: '' },
                    { key: chance.string(), value: '', externalValue: '' },
                  ],
                  encodings: [],
                },
              ],
            },
          ])
          .instance();

        const actualConfig = helpers.negotiateOptionsForInvalidRequest(httpOperation.responses);
        const expectedConfig: IHttpNegotiationResult = {
          code: actualCode,
          mediaType: actualMediaType,
          bodyExample: { key: actualExampleKey, value: '', externalValue: '' },
          headers: [],
        };

        expect(actualConfig).toEqual(expectedConfig);
      });

      describe('and has no static contents', () => {
        test('and has schemable contents should return first such contents', () => {
          httpOperation = anHttpOperation(httpOperation)
            .withResponses([
              {
                code: actualCode,
                headers: [],
                contents: [
                  {
                    mediaType: actualMediaType + chance.character(),
                    examples: [],
                    encodings: [],
                  },
                  {
                    schema: { type: 'type1' },
                    mediaType: actualMediaType,
                    examples: [],
                    encodings: [],
                  },
                  {
                    schema: { type: 'type2' },
                    mediaType: actualMediaType + chance.character(),
                    examples: [],
                    encodings: [],
                  },
                ],
              },
            ])
            .instance();

          const actualConfig = helpers.negotiateOptionsForInvalidRequest(httpOperation.responses);
          const expectedConfig: IHttpNegotiationResult = {
            code: actualCode,
            mediaType: actualMediaType,
            schema: { type: 'type1' },
            headers: [],
          };

          expect(actualConfig).toEqual(expectedConfig);
        });

        test('and no schemable contents should return error', () => {
          httpOperation = anHttpOperation(httpOperation)
            .withResponses([
              {
                code: actualCode,
                headers: [],
                contents: [
                  {
                    mediaType: actualMediaType,
                    examples: [],
                    encodings: [],
                  },
                  {
                    mediaType: actualMediaType,
                    examples: [],
                    encodings: [],
                  },
                ],
              },
            ])
            .instance();

          expect(() => {
            helpers.negotiateOptionsForInvalidRequest(httpOperation.responses);
          }).toThrow('Request invalid but mock data corrupted. Neither schema nor example defined for 422 response.');
        });
      });
    });

    describe('and no 422 response exists', () => {
      test('but a 400 response exists', async () => {
        httpOperation = anHttpOperation(httpOperation)
          .withResponses([
            {
              code: '400',
              headers: [],
              contents: [
                {
                  mediaType: chance.string(),
                  examples: [
                    { key: chance.string(), value: '', externalValue: '' },
                    { key: chance.string(), value: '', externalValue: '' },
                  ],
                  encodings: [],
                },
              ],
            },
          ])
          .instance();

        const actualConfig = helpers.negotiateOptionsForInvalidRequest(httpOperation.responses);
        expect(actualConfig).toHaveProperty('code', '400');
      });

      test('but a default response exists', async () => {
        httpOperation = anHttpOperation(httpOperation)
          .withResponses([
            {
              code: 'default',
              headers: [],
              contents: [
                {
                  mediaType: chance.string(),
                  examples: [
                    { key: chance.string(), value: '', externalValue: '' },
                    { key: chance.string(), value: '', externalValue: '' },
                  ],
                  encodings: [],
                },
              ],
            },
          ])
          .instance();

        const actualConfig = helpers.negotiateOptionsForInvalidRequest(httpOperation.responses);
        expect(actualConfig).toHaveProperty('code', '422');
      });

      test('should return an error', async () => {
        expect(() => {
          helpers.negotiateOptionsForInvalidRequest(httpOperation.responses);
        }).toThrow('No 422, 400, or default responses defined');
      });
    });
  });

  describe('negotiateOptionsForValidRequest()', () => {
    beforeEach(() => {
      jest.spyOn(helpers, 'negotiateOptionsForDefaultCode');
      jest.spyOn(helpers, 'negotiateOptionsBySpecificCode');
    });

    it('given status code enforced should negotiate a specific code', () => {
      const options = {
        code: chance.integer({ min: 100, max: 599 }).toString(),
        dynamic: false,
      };

      const expectedResult = {
        code: options.code,
        mediaType: 'application/json',
        headers: [],
      };

      jest.spyOn(helpers, 'negotiateOptionsForDefaultCode');
      jest.spyOn(helpers, 'negotiateOptionsBySpecificCode').mockReturnValue(expectedResult);

      const actualResult = helpers.negotiateOptionsForValidRequest(httpOperation, options);

      expect(helpers.negotiateOptionsForDefaultCode).not.toHaveBeenCalled();
      expect(helpers.negotiateOptionsBySpecificCode).toHaveBeenCalledTimes(1);
      expect(actualResult).toBe(expectedResult);
    });

    it('given status code not enforced should negotiate a default code', () => {
      const options = { dynamic: false };

      const expectedResult = {
        code: chance.integer({ min: 100, max: 599 }).toString(),
        mediaType: 'application/json',
        headers: [],
      };

      jest.spyOn(helpers, 'negotiateOptionsForDefaultCode').mockReturnValue(expectedResult);
      jest.spyOn(helpers, 'negotiateOptionsBySpecificCode');

      const actualResult = helpers.negotiateOptionsForValidRequest(httpOperation, options);

      expect(helpers.negotiateOptionsBySpecificCode).not.toHaveBeenCalled();
      expect(helpers.negotiateOptionsForDefaultCode).toHaveBeenCalledTimes(1);
      expect(actualResult).toBe(expectedResult);
    });
  });

  describe('negotiateOptionsBySpecificCode()', () => {
    let negotiateOptionsBySpecificResponseMock: jest.SpyInstance;
    let negotiateOptionsForDefaultCodeMock: jest.SpyInstance;

    beforeEach(() => {
      negotiateOptionsBySpecificResponseMock = jest.spyOn(helpers, 'negotiateOptionsBySpecificResponse');
      negotiateOptionsForDefaultCodeMock = jest.spyOn(helpers, 'negotiateOptionsForDefaultCode');
    });
    it('given response defined should try to negotiate by that response', () => {
      const code = chance.string();
      const fakeResponse = {
        code,
        contents: [],
        headers: [],
      };
      const desiredOptions = { dynamic: false };
      const fakeOperationConfig = {
        code,
      };
      negotiateOptionsBySpecificResponseMock.mockReturnValue(fakeOperationConfig);
      httpOperation = anHttpOperation(httpOperation)
        .withResponses([fakeResponse])
        .instance();

      const actualOperationConfig = helpers.negotiateOptionsBySpecificCode(httpOperation, desiredOptions, code);

      expect(negotiateOptionsBySpecificResponseMock).toHaveBeenCalledTimes(1);
      expect(negotiateOptionsBySpecificResponseMock).toHaveBeenCalledWith(httpOperation, desiredOptions, fakeResponse);
      expect(negotiateOptionsForDefaultCodeMock).not.toHaveBeenCalled();
      expect(actualOperationConfig).toBe(fakeOperationConfig);
    });

    it('given response defined should fallback to default code on error', () => {
      const code = chance.string();
      const fakeResponse = {
        code,
        contents: [],
        headers: [],
      };
      const desiredOptions = { dynamic: false };
      const fakeOperationConfig = {
        code,
      };
      negotiateOptionsBySpecificResponseMock = negotiateOptionsBySpecificResponseMock.mockImplementation(() => {
        throw new Error();
      });
      negotiateOptionsForDefaultCodeMock.mockReturnValue(fakeOperationConfig);
      httpOperation = anHttpOperation(httpOperation)
        .withResponses([fakeResponse])
        .instance();

      const actualOperationConfig = helpers.negotiateOptionsBySpecificCode(httpOperation, desiredOptions, code);

      expect(negotiateOptionsBySpecificResponseMock).toHaveBeenCalledTimes(1);
      expect(negotiateOptionsBySpecificResponseMock).toHaveBeenCalledWith(httpOperation, desiredOptions, fakeResponse);
      expect(negotiateOptionsForDefaultCodeMock).toHaveBeenCalledTimes(1);
      expect(negotiateOptionsForDefaultCodeMock).toHaveBeenCalledWith(httpOperation, desiredOptions);
      expect(actualOperationConfig).toBe(fakeOperationConfig);
    });

    it('given response not defined should fallback to default code', () => {
      const code = chance.string();
      const desiredOptions = { dynamic: false };
      httpOperation = anHttpOperation(httpOperation)
        .withResponses([])
        .instance();

      expect(() => helpers.negotiateOptionsBySpecificCode(httpOperation, desiredOptions, code)).toThrow(
        'Requested status code is not defined in the schema.',
      );
    });
  });

  describe('negotiateOptionsForDefaultCode()', () => {
    it('given only a generic 2XX response should negotiate that one', () => {
      const desiredOptions = { dynamic: false };
      const response = {
        code: '2xx',
        contents: [],
        headers: [],
      };
      const fakeOperationConfig = {
        code: response.code,
        mediaType: 'application/json',
        headers: [],
      };
      jest.spyOn(helpers, 'negotiateOptionsBySpecificResponse').mockReturnValue(fakeOperationConfig);
      httpOperation = anHttpOperation(httpOperation)
        .withResponses([response])
        .instance();

      const actualOperationConfig = helpers.negotiateOptionsForDefaultCode(httpOperation, desiredOptions);

      expect(helpers.negotiateOptionsBySpecificResponse).toHaveBeenCalledTimes(1);
      expect(actualOperationConfig).toBe(fakeOperationConfig);
    });

    it('given two 2xx response should negotiate the lowest', () => {
      const desiredOptions = { dynamic: false };
      const response = {
        code: '200',
        contents: [],
        headers: [],
      };

      const fakeOperationConfig = {
        code: response.code,
        mediaType: 'application/json',
        headers: [],
      };

      jest.spyOn(helpers, 'negotiateOptionsBySpecificResponse').mockReturnValue(fakeOperationConfig);
      httpOperation = anHttpOperation(httpOperation)
        .withResponses([
          response,
          {
            code: '201',
            contents: [],
            headers: [],
          },
          {
            code: '2xx',
            contents: [],
            headers: [],
          },
        ])
        .instance();

      const actualOperationConfig = helpers.negotiateOptionsForDefaultCode(httpOperation, desiredOptions);

      expect(helpers.negotiateOptionsBySpecificResponse).toHaveBeenCalledTimes(1);
      expect(actualOperationConfig).toBe(fakeOperationConfig);
    });

    it('given no 2xx response should throw exception', () => {
      const desiredOptions = { dynamic: false };
      jest.spyOn(helpers, 'negotiateOptionsBySpecificResponse');

      expect(() => {
        helpers.negotiateOptionsForDefaultCode(httpOperation, desiredOptions);
      }).toThrow('No 2** response defined, cannot mock');
    });
  });

  describe('negotiateOptionsBySpecificResponse()', () => {
    describe('given forced mediaType', () => {
      it('and httpContent exists should negotiate that contents', () => {
        const desiredOptions = {
          mediaType: chance.string(),
          dynamic: chance.bool(),
          exampleKey: chance.string(),
        };
        const contents: IMediaTypeContent = {
          mediaType: desiredOptions.mediaType,
          examples: [],
          encodings: [],
        };
        const httpResponseSchema: IHttpOperationResponse = {
          code: chance.integer({ min: 100, max: 599 }).toString(),
          contents: [contents],
          headers: [],
        };
        const fakeOperationConfig: IHttpNegotiationResult = {
          code: '200',
          mediaType: 'application/json',
          headers: [],
        };
        jest.spyOn(helpers, 'negotiateByPartialOptionsAndHttpContent').mockReturnValue(fakeOperationConfig);
        jest.spyOn(helpers, 'negotiateDefaultMediaType');

        const actualOperationConfig = helpers.negotiateOptionsBySpecificResponse(
          httpOperation,
          desiredOptions,
          httpResponseSchema,
        );

        expect(helpers.negotiateByPartialOptionsAndHttpContent).toHaveBeenCalledTimes(1);
        expect(helpers.negotiateByPartialOptionsAndHttpContent).toHaveBeenCalledWith(
          {
            code: httpResponseSchema.code,
            dynamic: desiredOptions.dynamic,
            exampleKey: desiredOptions.exampleKey,
          },
          contents,
        );
        expect(helpers.negotiateDefaultMediaType).not.toHaveBeenCalled();
        expect(actualOperationConfig).toEqual(fakeOperationConfig);
      });

      it('and httpContent not exist should negotiate default media type', () => {
        const desiredOptions = {
          mediaType: chance.string(),
          dynamic: chance.bool(),
          exampleKey: chance.string(),
        };
        const httpResponseSchema: IHttpOperationResponse = {
          code: chance.integer({ min: 100, max: 599 }).toString(),
          contents: [],
          headers: [],
        };

        expect(
          helpers.negotiateOptionsBySpecificResponse(httpOperation, desiredOptions, httpResponseSchema),
        ).toHaveProperty('mediaType', 'text/plain');
      });
    });

    describe('given no mediaType', () => {
      it('should negotiate default media type', () => {
        const desiredOptions = {
          dynamic: chance.bool(),
          exampleKey: chance.string(),
        };
        const httpResponseSchema: IHttpOperationResponse = {
          code: chance.integer({ min: 100, max: 599 }).toString(),
          contents: [],
          headers: [],
        };
        const fakeOperationConfig = {
          code: '200',
          mediaType: 'application/json',
          headers: [],
        };
        jest.spyOn(helpers, 'negotiateByPartialOptionsAndHttpContent');
        jest.spyOn(helpers, 'negotiateDefaultMediaType').mockReturnValue(fakeOperationConfig);

        const actualOperationConfig = helpers.negotiateOptionsBySpecificResponse(
          httpOperation,
          desiredOptions,
          httpResponseSchema,
        );

        expect(helpers.negotiateByPartialOptionsAndHttpContent).not.toHaveBeenCalled();
        expect(helpers.negotiateDefaultMediaType).toHaveBeenCalledTimes(1);
        expect(helpers.negotiateDefaultMediaType).toHaveBeenCalledWith(
          {
            code: httpResponseSchema.code,
            dynamic: desiredOptions.dynamic,
            exampleKey: desiredOptions.exampleKey,
          },
          httpResponseSchema,
        );
        expect(actualOperationConfig).toBe(fakeOperationConfig);
      });
    });
  });

  describe('negotiateDefaultMediaType()', () => {
    it('given default contents exists should negotiate that', () => {
      const code = chance.string();
      const partialOptions = {
        code,
        dynamic: chance.bool(),
        exampleKey: chance.string(),
      };

      const contents: IMediaTypeContent = {
        mediaType: 'application/json',
        examples: [],
        encodings: [],
      };

      const response: IHttpOperationResponse = {
        code,
        contents: [contents],
        headers: [],
      };

      const fakeOperationConfig: IHttpNegotiationResult = {
        code: '200',
        mediaType: 'application/json',
        headers: [],
      };

      jest.spyOn(helpers, 'negotiateByPartialOptionsAndHttpContent').mockReturnValue(fakeOperationConfig);

      const actualOperationConfig = helpers.negotiateDefaultMediaType(partialOptions, response);

      expect(helpers.negotiateByPartialOptionsAndHttpContent).toHaveBeenCalledTimes(1);
      expect(helpers.negotiateByPartialOptionsAndHttpContent).toHaveBeenCalledWith(
        {
          code,
          dynamic: partialOptions.dynamic,
          exampleKey: partialOptions.exampleKey,
        },
        contents,
      );
      expect(actualOperationConfig).toEqual(fakeOperationConfig);
    });

    it('when no default response return text/plain with empty body', () => {
      const code = chance.string();
      const partialOptions = { code: '200', dynamic: false };
      const response: IHttpOperationResponse = {
        code,
        contents: [],
        headers: [],
      };

      const expectedResponse: IHttpNegotiationResult = {
        code: '200',
        mediaType: 'text/plain',
        headers: [],
        bodyExample: {
          value: undefined,
          key: 'default',
        },
      };

      expect(helpers.negotiateDefaultMediaType(partialOptions, response)).toEqual(expectedResponse);
    });
  });

  describe('negotiateByPartialOptionsAndHttpContent()', () => {
    describe('given exampleKey forced', () => {
      it('and example exists should return that example', () => {
        const exampleKey = chance.string();
        const partialOptions = {
          code: chance.integer({ min: 100, max: 599 }).toString(),
          exampleKey,
          dynamic: chance.bool(),
        };
        const bodyExample: INodeExample = {
          key: exampleKey,
          value: '',
        };

        const httpContent: IMediaTypeContent = {
          mediaType: chance.string(),
          examples: [bodyExample],
          encodings: [],
        };

        const actualOperationConfig = helpers.negotiateByPartialOptionsAndHttpContent(partialOptions, httpContent);

        const expectedConfig: Omit<IHttpNegotiationResult, 'headers'> = {
          code: partialOptions.code,
          mediaType: httpContent.mediaType,
          bodyExample,
        };

        expect(actualOperationConfig).toEqual(expectedConfig);
      });

      it('and example not exist should throw an error', () => {
        const exampleKey = chance.string();
        const partialOptions = {
          code: chance.integer({ min: 100, max: 599 }).toString(),
          exampleKey,
          dynamic: chance.bool(),
        };
        const httpContent: IMediaTypeContent = {
          mediaType: chance.string(),
          examples: [],
          encodings: [],
        };

        expect(() => {
          helpers.negotiateByPartialOptionsAndHttpContent(partialOptions, httpContent);
        }).toThrow(`Response for contentType: ${httpContent.mediaType} and exampleKey: ${exampleKey} does not exist.`);
      });
    });

    describe('given exampleKey not forced but dynamic forced', () => {
      it('and httpContent has schema return that contents', () => {
        const partialOptions = {
          code: chance.integer({ min: 100, max: 599 }).toString(),
          dynamic: true,
        };
        const httpContent: IMediaTypeContent = {
          mediaType: chance.string(),
          examples: [],
          schema: { type: 'string' },
          encodings: [],
        };

        const actualOperationConfig = helpers.negotiateByPartialOptionsAndHttpContent(partialOptions, httpContent);

        expect(actualOperationConfig).toEqual({
          code: partialOptions.code,
          mediaType: httpContent.mediaType,
          schema: httpContent.schema,
        });
      });

      it('and httpContent has no schema throw error', () => {
        const partialOptions = {
          code: chance.integer({ min: 100, max: 599 }).toString(),
          dynamic: true,
        };
        const httpContent: IMediaTypeContent = {
          mediaType: chance.string(),
          examples: [],
          encodings: [],
        };

        expect(() => {
          helpers.negotiateByPartialOptionsAndHttpContent(partialOptions, httpContent);
        }).toThrow(`Tried to force a dynamic response for: ${httpContent.mediaType} but schema is not defined.`);
      });
    });

    describe('given neither exampleKey nor dynamic forced', () => {
      it('and can find other example return that example', () => {
        const partialOptions = {
          code: chance.integer({ min: 100, max: 599 }).toString(),
          dynamic: false,
        };
        const bodyExample: INodeExample | INodeExternalExample = {
          key: chance.string(),
          value: '',
          externalValue: '',
        };
        const httpContent: IMediaTypeContent = {
          mediaType: chance.string(),
          examples: [
            bodyExample,
            {
              key: chance.string(),
              value: '',
              externalValue: '',
            },
          ],
          encodings: [],
        };

        const actualOperationConfig = helpers.negotiateByPartialOptionsAndHttpContent(partialOptions, httpContent);
        const expectedConfig: Omit<IHttpNegotiationResult, 'headers'> = {
          code: partialOptions.code,
          mediaType: httpContent.mediaType,
          bodyExample,
        };
        expect(actualOperationConfig).toEqual(expectedConfig);
      });

      it('and cannot find example but schema exists return dynamic', () => {
        const partialOptions = {
          dynamic: false,
          code: chance.integer({ min: 100, max: 599 }).toString(),
        };
        const httpContent: IMediaTypeContent = {
          mediaType: chance.string(),
          examples: [],
          schema: { type: 'string' },
          encodings: [],
        };

        const actualOperationConfig = helpers.negotiateByPartialOptionsAndHttpContent(partialOptions, httpContent);

        expect(actualOperationConfig).toEqual({
          code: partialOptions.code,
          mediaType: httpContent.mediaType,
          schema: { type: 'string' },
        });
      });

      it('and cannot find example and dynamic does not exist throw error', () => {
        const partialOptions = {
          dynamic: false,
          code: chance.integer({ min: 100, max: 599 }).toString(),
        };

        const httpContent: IMediaTypeContent = {
          mediaType: chance.string(),
          examples: [],
          encodings: [],
        };

        const proposedResponse = helpers.negotiateByPartialOptionsAndHttpContent(partialOptions, httpContent);

        expect(proposedResponse).toHaveProperty('code');
        expect(proposedResponse).toHaveProperty('mediaType');
      });
    });
  });
});
