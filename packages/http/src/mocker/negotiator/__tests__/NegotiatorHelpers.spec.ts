import {
  IHttpOperation,
  IHttpOperationResponse,
  IMediaTypeContent,
  INodeExample,
  INodeExternalExample,
} from '@stoplight/types';
import { Chance } from 'chance';
import { reader } from 'fp-ts/lib/Reader';

import { createLogger } from '@stoplight/prism-core';

import * as Either from 'fp-ts/lib/Either';
import { left, right } from 'fp-ts/lib/ReaderEither';
import { assertLeft, assertRight } from '../../../__tests__/utils';
import helpers from '../NegotiatorHelpers';
import { IHttpNegotiationResult, NegotiationOptions } from '../types';

const chance = new Chance();
const logger = createLogger('TEST', { enabled: false });

function anHttpOperation(givenHttpOperation?: IHttpOperation) {
  const httpOperation = givenHttpOperation || {
    method: chance.string(),
    path: chance.url(),
    responses: [{ code: '300' }],
    id: chance.string(),
    request: {},
  };
  return {
    instance() {
      return httpOperation;
    },
    withResponses(responses: IHttpOperationResponse[] & { 0: IHttpOperationResponse }) {
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

        const actualConfig = helpers.negotiateOptionsForInvalidRequest(httpOperation.responses)(logger);
        const expectedConfig: IHttpNegotiationResult = {
          code: actualCode,
          mediaType: actualMediaType,
          bodyExample: { key: actualExampleKey, value: '', externalValue: '' },
          headers: [],
        };

        assertRight(actualConfig, operationConfig => expect(operationConfig).toEqual(expectedConfig));
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
                  },
                  {
                    schema: { type: 'string' },
                    mediaType: actualMediaType,
                  },
                  {
                    schema: { type: 'number' },
                    mediaType: actualMediaType + chance.character(),
                  },
                ],
              },
            ])
            .instance();

          const actualConfig = helpers.negotiateOptionsForInvalidRequest(httpOperation.responses)(logger);
          const expectedConfig: IHttpNegotiationResult = {
            code: actualCode,
            mediaType: actualMediaType,
            schema: { type: 'string' },
            headers: [],
          };

          assertRight(actualConfig, operationConfig => expect(operationConfig).toEqual(expectedConfig));
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

          const negotiationResult = helpers.negotiateOptionsForInvalidRequest(httpOperation.responses)(logger);

          assertLeft(negotiationResult, e =>
            expect(e.message).toBe('Neither schema nor example defined for 422 response.'),
          );
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

        const actualConfig = helpers.negotiateOptionsForInvalidRequest(httpOperation.responses)(logger);
        assertRight(actualConfig, c => expect(c).toHaveProperty('code', '400'));
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

        const actualConfig = helpers.negotiateOptionsForInvalidRequest(httpOperation.responses)(logger);
        assertRight(actualConfig, config => expect(config).toHaveProperty('code', '422'));
      });

      test('should return an error', () => {
        assertLeft(helpers.negotiateOptionsForInvalidRequest(httpOperation.responses)(logger), error =>
          expect(error).toHaveProperty('message', 'No 422, 400, or default responses defined'),
        );
      });
    });
  });

  describe('negotiateOptionsForValidRequest()', () => {
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

      const negotiateOptionsForDefaultCodeSpy = jest.spyOn(helpers, 'negotiateOptionsForDefaultCode');
      const negotiateOptionsBySpecificCodeSpy = jest
        .spyOn(helpers, 'negotiateOptionsBySpecificCode')
        .mockReturnValue(right(expectedResult));

      const actualResult = helpers.negotiateOptionsForValidRequest(httpOperation, options)(logger);

      expect(negotiateOptionsForDefaultCodeSpy).not.toHaveBeenCalled();
      expect(negotiateOptionsBySpecificCodeSpy).toHaveBeenCalledTimes(1);

      assertRight(actualResult, result => expect(result).toEqual(expectedResult));
    });

    it('given status code not enforced should negotiate a default code', () => {
      const options = { dynamic: false };

      const expectedResult = {
        code: chance.integer({ min: 100, max: 599 }).toString(),
        mediaType: 'application/json',
        headers: [],
      };

      const negotiateOptionsForDefaultCodeSpy = jest
        .spyOn(helpers, 'negotiateOptionsForDefaultCode')
        .mockReturnValue(right(expectedResult));

      const negotiateOptionsBySpecificCodeSpy = jest.spyOn(helpers, 'negotiateOptionsBySpecificCode');

      const actualResult = helpers.negotiateOptionsForValidRequest(httpOperation, options)(logger);

      expect(negotiateOptionsBySpecificCodeSpy).not.toHaveBeenCalled();
      expect(negotiateOptionsForDefaultCodeSpy).toHaveBeenCalledTimes(1);

      assertRight(actualResult, result => expect(result).toEqual(expectedResult));
    });
  });

  describe('negotiateOptionsBySpecificCode()', () => {
    let negotiateOptionsBySpecificResponseMock: jest.SpyInstance;
    let negotiateOptionsForDefaultCodeMock: jest.SpyInstance;

    beforeEach(() => {
      negotiateOptionsBySpecificResponseMock = jest.spyOn(helpers, 'negotiateOptionsBySpecificResponse');
      negotiateOptionsForDefaultCodeMock = jest.spyOn(helpers, 'negotiateOptionsForDefaultCode');
    });

    afterEach(() => {
      negotiateOptionsBySpecificResponseMock.mockClear();
      negotiateOptionsForDefaultCodeMock.mockClear();
    });

    it('given response defined should try to negotiate by that response', () => {
      const code = chance.string();
      const fakeResponse = {
        code,
        contents: [],
        headers: [],
      };
      const desiredOptions = { dynamic: false };
      const fakeOperationConfig: IHttpNegotiationResult = {
        code,
        headers: [],
        mediaType: '',
      };

      negotiateOptionsBySpecificResponseMock.mockReturnValue(right(fakeOperationConfig));
      httpOperation = anHttpOperation(httpOperation)
        .withResponses([fakeResponse])
        .instance();

      const actualOperationConfig = helpers.negotiateOptionsBySpecificCode(httpOperation, desiredOptions, code)(logger);

      expect(negotiateOptionsBySpecificResponseMock).toHaveBeenCalledTimes(1);
      expect(negotiateOptionsBySpecificResponseMock).toHaveBeenCalledWith(httpOperation, desiredOptions, fakeResponse);
      expect(negotiateOptionsForDefaultCodeMock).not.toHaveBeenCalled();
      assertRight(actualOperationConfig, operationConfig => {
        expect(operationConfig).toEqual(fakeOperationConfig);
      });
    });

    it('given response defined should fallback to default code on error', () => {
      const code = chance.string();
      const fakeResponse = {
        code,
      };
      const desiredOptions = { dynamic: false };
      const fakeOperationConfig: IHttpNegotiationResult = {
        code,
        mediaType: '',
        headers: [],
      };

      negotiateOptionsBySpecificResponseMock.mockReturnValue(left(new Error('Hey')));
      negotiateOptionsForDefaultCodeMock.mockReturnValue(right(fakeOperationConfig));
      httpOperation = anHttpOperation(httpOperation)
        .withResponses([fakeResponse])
        .instance();

      const actualOperationConfig = helpers.negotiateOptionsBySpecificCode(httpOperation, desiredOptions, code)(logger);

      expect(negotiateOptionsBySpecificResponseMock).toHaveBeenCalledTimes(1);
      expect(negotiateOptionsBySpecificResponseMock).toHaveBeenCalledWith(httpOperation, desiredOptions, fakeResponse);
      expect(negotiateOptionsForDefaultCodeMock).toHaveBeenCalledTimes(1);
      expect(negotiateOptionsForDefaultCodeMock).toHaveBeenCalledWith(httpOperation, desiredOptions);
      assertRight(actualOperationConfig, operationConfig => {
        expect(operationConfig).toEqual(fakeOperationConfig);
      });
    });

    it('given response not defined should fallback to default code', () => {
      const code = chance.string();
      const desiredOptions = { dynamic: false };
      httpOperation = anHttpOperation(httpOperation).instance();

      assertLeft(helpers.negotiateOptionsBySpecificCode(httpOperation, desiredOptions, code)(logger), error =>
        expect(error).toHaveProperty('message', 'The server cannot find the requested content'),
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
      jest.spyOn(helpers, 'negotiateOptionsBySpecificResponse').mockReturnValue(right(fakeOperationConfig));
      httpOperation = anHttpOperation(httpOperation)
        .withResponses([response])
        .instance();

      const actualOperationConfig = helpers.negotiateOptionsForDefaultCode(httpOperation, desiredOptions)(logger);

      expect(helpers.negotiateOptionsBySpecificResponse).toHaveBeenCalledTimes(1);
      assertRight(actualOperationConfig, operationConfig => {
        expect(operationConfig).toEqual(fakeOperationConfig);
      });
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

      jest.spyOn(helpers, 'negotiateOptionsBySpecificResponse').mockReturnValue(right(fakeOperationConfig));
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

      const actualOperationConfig = helpers.negotiateOptionsForDefaultCode(httpOperation, desiredOptions)(logger);

      expect(helpers.negotiateOptionsBySpecificResponse).toHaveBeenCalledTimes(1);
      assertRight(actualOperationConfig, operationConfig => {
        expect(operationConfig).toEqual(fakeOperationConfig);
      });
    });

    it('given no 2xx response should throw exception', () => {
      const desiredOptions = { dynamic: false };
      jest.spyOn(helpers, 'negotiateOptionsBySpecificResponse');

      const negotiationResult = helpers.negotiateOptionsForDefaultCode(httpOperation, desiredOptions)(logger);
      assertLeft(negotiationResult, e => {
        expect(e.message).toBe('No 2** response defined, cannot mock');
      });
    });
  });

  describe('negotiateOptionsBySpecificResponse()', () => {
    describe('given forced mediaType', () => {
      it('and httpContent exists should negotiate that contents', () => {
        const desiredOptions = {
          mediaTypes: [`${chance.string()}/${chance.string()}`],
          dynamic: chance.bool(),
          exampleKey: chance.string(),
        };

        const contents: IMediaTypeContent = {
          mediaType: desiredOptions.mediaTypes[0],
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
          mediaType: desiredOptions.mediaTypes[0],
          headers: [],
        };
        jest
          .spyOn(helpers, 'negotiateByPartialOptionsAndHttpContent')
          .mockReturnValue(Either.right(fakeOperationConfig));
        jest.spyOn(helpers, 'negotiateDefaultMediaType');

        const actualOperationConfig = helpers.negotiateOptionsBySpecificResponse(
          httpOperation,
          desiredOptions,
          httpResponseSchema,
        )(logger);

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
        assertRight(actualOperationConfig, operationConfig => {
          expect(operationConfig).toEqual(fakeOperationConfig);
        });
      });

      describe('the resource has multiple contents', () => {
        it('should negotiatiate the content according to the preference', () => {
          const desiredOptions: NegotiationOptions = {
            mediaTypes: ['application/json', 'application/xml'],
            dynamic: false,
          };

          const contents: IMediaTypeContent[] = desiredOptions.mediaTypes!.reverse().map(mediaType => ({
            mediaType,
            encodings: [],
            examples: [],
          }));

          const httpResponseSchema: IHttpOperationResponse = {
            code: chance.integer({ min: 100, max: 599 }).toString(),
            contents,
            headers: [],
          };

          const actualOperationConfig = helpers.negotiateOptionsBySpecificResponse(
            httpOperation,
            desiredOptions,
            httpResponseSchema,
          )(logger);

          assertRight(actualOperationConfig, config => expect(config).toHaveProperty('mediaType', 'application/xml'));
        });

        it('should negotiatiate the only content that is really avaiable', () => {
          const desiredOptions: NegotiationOptions = {
            mediaTypes: ['application/idonotexist', 'application/json'],
            dynamic: false,
          };

          const content: IMediaTypeContent = {
            mediaType: 'application/json',
            encodings: [],
            examples: [],
          };

          const httpResponseSchema: IHttpOperationResponse = {
            code: chance.integer({ min: 100, max: 599 }).toString(),
            contents: [content],
            headers: [],
          };

          const actualOperationConfig = helpers.negotiateOptionsBySpecificResponse(
            httpOperation,
            desiredOptions,
            httpResponseSchema,
          )(logger);

          assertRight(actualOperationConfig, config => expect(config).toHaveProperty('mediaType', 'application/json'));
        });
      });

      it('and httpContent not exist should throw an error', () => {
        const desiredOptions: NegotiationOptions = {
          mediaTypes: [chance.string()],
          dynamic: chance.bool(),
          exampleKey: chance.string(),
        };

        const httpResponseSchema: IHttpOperationResponse = {
          code: chance.integer({ min: 100, max: 599 }).toString(),
          contents: [],
          headers: [],
        };

        const actualResponse = helpers.negotiateOptionsBySpecificResponse(
          httpOperation,
          desiredOptions,
          httpResponseSchema,
        )(logger);

        expect(Either.isLeft(actualResponse)).toBeTruthy();
      });
    });

    describe('given no mediaType', () => {
      it('should negotiate default media type', () => {
        const desiredOptions: NegotiationOptions = {
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
        jest.spyOn(helpers, 'negotiateDefaultMediaType').mockReturnValue(Either.right(fakeOperationConfig));

        const actualOperationConfig = helpers.negotiateOptionsBySpecificResponse(
          httpOperation,
          desiredOptions,
          httpResponseSchema,
        )(logger);

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

        assertRight(actualOperationConfig, operationConfig => {
          expect(operationConfig).toEqual(fakeOperationConfig);
        });
      });
    });
  });

  describe('negotiateDefaultMediaType()', () => {
    describe('default content', () => {
      it.each([['*/*', 'application/xml'], ['*/*', 'application/json'], ['application/json', 'application/xml']])(
        'should return %s even when %s is avaiable',
        (defaultMediaType, alternateMediaType) => {
          const code = chance.string();
          const partialOptions = {
            code,
            dynamic: chance.bool(),
            exampleKey: chance.string(),
          };

          const contents: IMediaTypeContent[] = [alternateMediaType, defaultMediaType].map(mediaType => ({
            mediaType,
            examples: [],
            encodings: [],
          }));

          const response: IHttpOperationResponse = {
            code,
            contents,
            headers: [],
          };

          const fakeOperationConfig: IHttpNegotiationResult = {
            code: '200',
            mediaType: defaultMediaType,
            headers: [],
          };

          jest
            .spyOn(helpers, 'negotiateByPartialOptionsAndHttpContent')
            .mockReturnValue(Either.right(fakeOperationConfig));

          const actualOperationConfig = helpers.negotiateDefaultMediaType(partialOptions, response);

          expect(helpers.negotiateByPartialOptionsAndHttpContent).toHaveBeenCalledTimes(1);
          expect(helpers.negotiateByPartialOptionsAndHttpContent).toHaveBeenCalledWith(
            {
              code,
              dynamic: partialOptions.dynamic,
              exampleKey: partialOptions.exampleKey,
            },
            contents[1], // Check that the */* has been requested
          );

          assertRight(actualOperationConfig, operationConfig => {
            expect(operationConfig).toEqual(fakeOperationConfig);
          });
        },
      );
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

      const negotiationResult = helpers.negotiateDefaultMediaType(partialOptions, response);

      assertRight(negotiationResult, result => {
        expect(result).toEqual(expectedResponse);
      });
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

        assertRight(actualOperationConfig, operationConfig => {
          expect(operationConfig).toEqual(expectedConfig);
        });
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

        const negotiationResult = helpers.negotiateByPartialOptionsAndHttpContent(partialOptions, httpContent);
        assertLeft(negotiationResult, e => {
          expect(e.message).toBe(
            `Response for contentType: ${httpContent.mediaType} and exampleKey: ${exampleKey} does not exist.`,
          );
        });
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

        assertRight(actualOperationConfig, operationConfig => {
          expect(operationConfig).toEqual({
            code: partialOptions.code,
            mediaType: httpContent.mediaType,
            schema: httpContent.schema,
          });
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

        const negotiationResult = helpers.negotiateByPartialOptionsAndHttpContent(partialOptions, httpContent);

        assertLeft(negotiationResult, e =>
          expect(e.message).toBe(
            `Tried to force a dynamic response for: ${httpContent.mediaType} but schema is not defined.`,
          ),
        );
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

        assertRight(actualOperationConfig, operationConfig => {
          expect(operationConfig).toEqual(expectedConfig);
        });
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

        assertRight(actualOperationConfig, operationConfig => {
          expect(operationConfig).toEqual({
            code: partialOptions.code,
            mediaType: httpContent.mediaType,
            schema: { type: 'string' },
          });
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

        assertRight(proposedResponse, response => {
          expect(response).toHaveProperty('code');
          expect(response).toHaveProperty('mediaType');
        });
      });
    });
  });
});
