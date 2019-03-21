import {
  IHttpContent,
  IHttpOperation,
  IHttpOperationResponse,
  INodeExample,
  INodeExternalExample,
} from '@stoplight/types';
import { Chance } from 'chance';

import helpers from '../NegotiatorHelpers';

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
    describe('and 400 response exists', () => {
      const actualCode = '400';
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
        const expectedConfig = {
          code: actualCode,
          mediaType: actualMediaType,
          example: { key: actualExampleKey, value: '', externalValue: '' },
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
          const expectedConfig = {
            code: actualCode,
            mediaType: actualMediaType,
            schema: { type: 'type1' },
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
          }).toThrow(
            'Request invalid but mock data corrupted. Neither schema nor example defined for 400 response.'
          );
        });
      });
    });

    describe('and no 400 response exists', () => {
      test('should return an error', async () => {
        expect(() => {
          helpers.negotiateOptionsForInvalidRequest(httpOperation.responses);
        }).toThrow('No 400 response defined');
      });
    });
  });

  describe('negotiateOptionsForValidRequest()', () => {
    beforeEach(() => {
      jest.spyOn(helpers, 'negotiateOptionsForDefaultCode').mockImplementation(() => {
        // Spy
      });
      jest.spyOn(helpers, 'negotiateOptionsBySpecificCode').mockImplementation(() => {
        // Spy
      });
    });

    it('given status code enforced should negotiate a specific code', () => {
      const options = {
        code: chance.string(),
      };
      const expectedResult = {
        code: options.code,
      };
      jest.spyOn(helpers, 'negotiateOptionsForDefaultCode').mockImplementation(() => {
        // Spy
      });
      jest
        .spyOn(helpers, 'negotiateOptionsBySpecificCode')
        .mockImplementation(() => {
          // Spy
        })
        .mockReturnValue(expectedResult);

      const actualResult = helpers.negotiateOptionsForValidRequest(httpOperation, options);

      expect(helpers.negotiateOptionsForDefaultCode).not.toHaveBeenCalled();
      expect(helpers.negotiateOptionsBySpecificCode).toHaveBeenCalledTimes(1);
      expect(actualResult).toBe(expectedResult);
    });

    it('given status code not enforced should negotiate a default code', () => {
      const options = {};
      const expectedResult = {
        code: chance.string(),
      };
      jest
        .spyOn(helpers, 'negotiateOptionsForDefaultCode')
        .mockImplementation(() => {
          // Spy
        })
        .mockReturnValue(expectedResult);
      jest.spyOn(helpers, 'negotiateOptionsBySpecificCode').mockImplementation(() => {
        // Spy
      });

      const actualResult = helpers.negotiateOptionsForValidRequest(httpOperation, options);

      expect(helpers.negotiateOptionsBySpecificCode).not.toHaveBeenCalled();
      expect(helpers.negotiateOptionsForDefaultCode).toHaveBeenCalledTimes(1);
      expect(actualResult).toBe(expectedResult);
    });
  });

  describe('negotiateOptionsBySpecificCode()', () => {
    let negotiateOptionsBySpecificResponseMock: jest.Mock;
    let negotiateOptionsForDefaultCodeMock: jest.Mock;

    beforeEach(() => {
      negotiateOptionsBySpecificResponseMock = jest
        .spyOn(helpers, 'negotiateOptionsBySpecificResponse')
        .mockImplementation(() => {
          // Spy
        });
      negotiateOptionsForDefaultCodeMock = jest
        .spyOn(helpers, 'negotiateOptionsForDefaultCode')
        .mockImplementation(() => {
          // Spy
        });
    });
    it('given response defined should try to negotiate by that response', () => {
      const code = chance.string();
      const fakeResponse = {
        code,
        contents: [],
        headers: [],
      };
      const desiredOptions = {};
      const fakeOperationConfig = {
        code,
      };
      negotiateOptionsBySpecificResponseMock.mockReturnValue(fakeOperationConfig);
      httpOperation = anHttpOperation(httpOperation)
        .withResponses([fakeResponse])
        .instance();

      const actualOperationConfig = helpers.negotiateOptionsBySpecificCode(
        httpOperation,
        desiredOptions,
        code
      );

      expect(negotiateOptionsBySpecificResponseMock).toHaveBeenCalledTimes(1);
      expect(negotiateOptionsBySpecificResponseMock).toHaveBeenCalledWith(
        httpOperation,
        desiredOptions,
        fakeResponse
      );
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
      const desiredOptions = {};
      const fakeOperationConfig = {
        code,
      };
      negotiateOptionsBySpecificResponseMock = negotiateOptionsBySpecificResponseMock.mockImplementation(
        () => {
          throw new Error();
        }
      );
      negotiateOptionsForDefaultCodeMock.mockReturnValue(fakeOperationConfig);
      httpOperation = anHttpOperation(httpOperation)
        .withResponses([fakeResponse])
        .instance();

      const actualOperationConfig = helpers.negotiateOptionsBySpecificCode(
        httpOperation,
        desiredOptions,
        code
      );

      expect(negotiateOptionsBySpecificResponseMock).toHaveBeenCalledTimes(1);
      expect(negotiateOptionsBySpecificResponseMock).toHaveBeenCalledWith(
        httpOperation,
        desiredOptions,
        fakeResponse
      );
      expect(negotiateOptionsForDefaultCodeMock).toHaveBeenCalledTimes(1);
      expect(negotiateOptionsForDefaultCodeMock).toHaveBeenCalledWith(
        httpOperation,
        desiredOptions
      );
      expect(actualOperationConfig).toBe(fakeOperationConfig);
    });

    it('given response not defined should fallback to default code', () => {
      const code = chance.string();
      const desiredOptions = {};
      httpOperation = anHttpOperation(httpOperation)
        .withResponses([])
        .instance();

      expect(() =>
        helpers.negotiateOptionsBySpecificCode(httpOperation, desiredOptions, code)
      ).toThrow('Requested status code is not defined in the schema.');
    });
  });

  describe('negotiateOptionsForDefaultCode()', () => {
    it('given only a generic 2XX response should negotiate that one', () => {
      const desiredOptions = {};
      const response = {
        code: '2xx',
        contents: [],
        headers: [],
      };
      const fakeOperationConfig = {
        code: response.code,
      };
      jest
        .spyOn(helpers, 'negotiateOptionsBySpecificResponse')
        .mockReturnValue(fakeOperationConfig);
      httpOperation = anHttpOperation(httpOperation)
        .withResponses([response])
        .instance();

      const actualOperationConfig = helpers.negotiateOptionsForDefaultCode(
        httpOperation,
        desiredOptions
      );

      expect(helpers.negotiateOptionsBySpecificResponse).toHaveBeenCalledTimes(1);
      expect(actualOperationConfig).toBe(fakeOperationConfig);
    });

    it('given two 2xx response should negotiate the lowest', () => {
      const desiredOptions = {};
      const response = {
        code: '200',
        contents: [],
        headers: [],
      };
      const fakeOperationConfig = {
        code: response.code,
      };
      jest
        .spyOn(helpers, 'negotiateOptionsBySpecificResponse')
        .mockReturnValue(fakeOperationConfig);
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

      const actualOperationConfig = helpers.negotiateOptionsForDefaultCode(
        httpOperation,
        desiredOptions
      );

      expect(helpers.negotiateOptionsBySpecificResponse).toHaveBeenCalledTimes(1);
      expect(actualOperationConfig).toBe(fakeOperationConfig);
    });

    it('given no 2xx response should throw exception', () => {
      const desiredOptions = {};
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
        const contents: IHttpContent = {
          mediaType: desiredOptions.mediaType,
          examples: [],
          encodings: [],
        };
        const httpResponseSchema: IHttpOperationResponse = {
          code: chance.string(),
          contents: [contents],
          headers: [],
        };
        const fakeOperationConfig = {};
        jest
          .spyOn(helpers, 'negotiateByPartialOptionsAndHttpContent')
          .mockReturnValue(fakeOperationConfig);
        jest.spyOn(helpers, 'negotiateDefaultMediaType');

        const actualOperationConfig = helpers.negotiateOptionsBySpecificResponse(
          httpOperation,
          desiredOptions,
          httpResponseSchema
        );

        expect(helpers.negotiateByPartialOptionsAndHttpContent).toHaveBeenCalledTimes(1);
        expect(helpers.negotiateByPartialOptionsAndHttpContent).toHaveBeenCalledWith(
          {
            code: httpResponseSchema.code,
            dynamic: desiredOptions.dynamic,
            exampleKey: desiredOptions.exampleKey,
          },
          contents
        );
        expect(helpers.negotiateDefaultMediaType).not.toHaveBeenCalled();
        expect(actualOperationConfig).toBe(fakeOperationConfig);
      });

      it('and httpContent not exist should negotiate default media type', () => {
        const desiredOptions = {
          mediaType: chance.string(),
          dynamic: chance.bool(),
          exampleKey: chance.string(),
        };
        const httpResponseSchema: IHttpOperationResponse = {
          code: chance.string(),
          contents: [],
          headers: [],
        };

        expect(() =>
          helpers.negotiateOptionsBySpecificResponse(
            httpOperation,
            desiredOptions,
            httpResponseSchema
          )
        ).toThrow('Requested content type is not defined in the schema');
      });
    });

    describe('given no mediaType', () => {
      it('should negotiate default media type', () => {
        const desiredOptions = {
          dynamic: chance.bool(),
          exampleKey: chance.string(),
        };
        const httpResponseSchema: IHttpOperationResponse = {
          code: chance.string(),
          contents: [],
          headers: [],
        };
        const fakeOperationConfig = {};
        jest.spyOn(helpers, 'negotiateByPartialOptionsAndHttpContent');
        jest.spyOn(helpers, 'negotiateDefaultMediaType').mockReturnValue(fakeOperationConfig);

        const actualOperationConfig = helpers.negotiateOptionsBySpecificResponse(
          httpOperation,
          desiredOptions,
          httpResponseSchema
        );

        expect(helpers.negotiateByPartialOptionsAndHttpContent).not.toHaveBeenCalled();
        expect(helpers.negotiateDefaultMediaType).toHaveBeenCalledTimes(1);
        expect(helpers.negotiateDefaultMediaType).toHaveBeenCalledWith(
          {
            code: httpResponseSchema.code,
            dynamic: desiredOptions.dynamic,
            exampleKey: desiredOptions.exampleKey,
          },
          httpResponseSchema
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
      const contents: IHttpContent = {
        mediaType: 'application/json',
        examples: [],
        encodings: [],
      };
      const response: IHttpOperationResponse = {
        code,
        contents: [contents],
        headers: [],
      };
      const fakeOperationConfig = {};
      jest
        .spyOn(helpers, 'negotiateByPartialOptionsAndHttpContent')
        .mockReturnValue(fakeOperationConfig);

      const actualOperationConfig = helpers.negotiateDefaultMediaType(partialOptions, response);

      expect(helpers.negotiateByPartialOptionsAndHttpContent).toHaveBeenCalledTimes(1);
      expect(helpers.negotiateByPartialOptionsAndHttpContent).toHaveBeenCalledWith(
        {
          code,
          dynamic: partialOptions.dynamic,
          exampleKey: partialOptions.exampleKey,
        },
        contents
      );
      expect(actualOperationConfig).toBe(fakeOperationConfig);
    });

    it('given no default contents should throw', () => {
      const code = chance.string();
      const partialOptions = { code: '200' };
      const response: IHttpOperationResponse = {
        code,
        contents: [],
        headers: [],
      };

      expect(() => {
        helpers.negotiateDefaultMediaType(partialOptions, response);
      }).toThrow(
        'Could not generate response for provided content type or no content type provided. Tried to fallback to application/json, but no definition found.'
      );
    });
  });

  describe('negotiateByPartialOptionsAndHttpContent()', () => {
    describe('given exampleKey forced', () => {
      it('and example exists should return that example', () => {
        const exampleKey = chance.string();
        const partialOptions = {
          code: chance.string(),
          exampleKey,
          dynamic: chance.bool(),
        };
        const example: INodeExample | INodeExternalExample = {
          key: exampleKey,
          value: '',
          externalValue: '',
        };
        const httpContent: IHttpContent = {
          mediaType: chance.string(),
          examples: [example],
          encodings: [],
        };

        const actualOperationConfig = helpers.negotiateByPartialOptionsAndHttpContent(
          partialOptions,
          httpContent
        );

        expect(actualOperationConfig).toEqual({
          code: partialOptions.code,
          mediaType: httpContent.mediaType,
          example,
        });
      });

      it('and example not exist should throw an error', () => {
        const exampleKey = chance.string();
        const partialOptions = {
          code: chance.string(),
          exampleKey,
          dynamic: chance.bool(),
        };
        const httpContent: IHttpContent = {
          mediaType: chance.string(),
          examples: [],
          encodings: [],
        };

        expect(() => {
          helpers.negotiateByPartialOptionsAndHttpContent(partialOptions, httpContent);
        }).toThrow(
          `Response for contentType: ${
          httpContent.mediaType
          } and exampleKey: ${exampleKey} does not exist.`
        );
      });
    });

    describe('given exampleKey not forced but dynamic forced', () => {
      it('and httpContent has schema return that contents', () => {
        const partialOptions = {
          code: chance.string(),
          dynamic: true,
        };
        const httpContent: IHttpContent = {
          mediaType: chance.string(),
          examples: [],
          schema: { type: 'string' },
          encodings: [],
        };

        const actualOperationConfig = helpers.negotiateByPartialOptionsAndHttpContent(
          partialOptions,
          httpContent
        );

        expect(actualOperationConfig).toEqual({
          code: partialOptions.code,
          mediaType: httpContent.mediaType,
          schema: httpContent.schema,
        });
      });

      it('and httpContent has no schema throw error', () => {
        const partialOptions = {
          code: chance.string(),
          dynamic: true,
        };
        const httpContent: IHttpContent = {
          mediaType: chance.string(),
          examples: [],
          encodings: [],
        };

        expect(() => {
          helpers.negotiateByPartialOptionsAndHttpContent(partialOptions, httpContent);
        }).toThrow(
          `Tried to force a dynamic response for: ${
          httpContent.mediaType
          } but schema is not defined.`
        );
      });
    });

    describe('given neither exampleKey nor dynamic forced', () => {
      it('and can find other example return that example', () => {
        const partialOptions = {
          code: chance.string(),
        };
        const example: INodeExample | INodeExternalExample = {
          key: chance.string(),
          value: '',
          externalValue: '',
        };
        const httpContent: IHttpContent = {
          mediaType: chance.string(),
          examples: [
            example,
            {
              key: chance.string(),
              value: '',
              externalValue: '',
            },
          ],
          encodings: [],
        };

        const actualOperationConfig = helpers.negotiateByPartialOptionsAndHttpContent(
          partialOptions,
          httpContent
        );

        expect(actualOperationConfig).toEqual({
          code: partialOptions.code,
          mediaType: httpContent.mediaType,
          example,
        });
      });

      it('and cannot find example but schema exists return dynamic', () => {
        const partialOptions = {
          code: chance.string(),
        };
        const httpContent: IHttpContent = {
          mediaType: chance.string(),
          examples: [],
          schema: { type: 'string' },
          encodings: [],
        };

        const actualOperationConfig = helpers.negotiateByPartialOptionsAndHttpContent(
          partialOptions,
          httpContent
        );

        expect(actualOperationConfig).toEqual({
          code: partialOptions.code,
          mediaType: httpContent.mediaType,
          schema: { type: 'string' },
        });
      });
    });
  });
});
