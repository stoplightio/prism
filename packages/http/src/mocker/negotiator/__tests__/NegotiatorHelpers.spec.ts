import { createLogger } from '@stoplight/prism-core';
import {
  IHttpOperation,
  IHttpOperationResponse,
  IMediaTypeContent,
  INodeExample,
  INodeExternalExample,
} from '@stoplight/types';
import { Chance } from 'chance';
import * as E from 'fp-ts/lib/Either';
import { left, right } from 'fp-ts/lib/ReaderEither';
import { assertRight, assertLeft, assertSome } from '@stoplight/prism-core/src/__tests__/utils';
import helpers from '../NegotiatorHelpers';
import { IHttpNegotiationResult, NegotiationOptions } from '../types';
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import { findBestHttpContentByMediaType } from '../InternalHelpers';

const chance = new Chance();
const chanceOptions: Partial<Chance.StringOptions> = { length: 8, casing: 'lower', alpha: true, numeric: false };

const logger = createLogger('TEST', { enabled: false });

const assertPayloadlessResponse = (actualResponse: E.Either<Error, IHttpNegotiationResult>) => {
  assertRight(actualResponse, response => {
    expect(response).not.toHaveProperty('bodyExample');
    expect(response).not.toHaveProperty('mediaType');
    expect(response).not.toHaveProperty('schema');

    expect(response).toHaveProperty('code');
    expect(response).toHaveProperty('headers');
  });
};

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
    withResponses(responses: NonEmptyArray<IHttpOperationResponse>) {
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
      const actualMediaType = `${chance.string(chanceOptions)}/${chance.string(chanceOptions)}`;
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

        const actualConfig = helpers.negotiateOptionsForInvalidRequest(httpOperation.responses, ['422', '400'])(logger);
        const expectedConfig: IHttpNegotiationResult = {
          code: actualCode,
          mediaType: actualMediaType,
          bodyExample: { key: actualExampleKey, value: '', externalValue: '' },
          headers: [],
        };

        assertRight(actualConfig, operationConfig => expect(operationConfig).toEqual(expectedConfig));
      });

      describe('and has no static contents', () => {
        it('returns an empty payload response for an invalid request', () => {
          httpOperation = anHttpOperation(httpOperation)
            .withResponses([
              {
                code: actualCode,
                headers: [],
                contents: [],
              },
            ])
            .instance();

          const actualResponse = helpers.negotiateOptionsForInvalidRequest(httpOperation.responses, ['422', '400'])(
            logger
          );

          assertPayloadlessResponse(actualResponse);
        });

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

          const actualConfig = helpers.negotiateOptionsForInvalidRequest(httpOperation.responses, ['422', '400'])(
            logger
          );
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

          const negotiationResult = helpers.negotiateOptionsForInvalidRequest(httpOperation.responses, ['422', '400'])(
            logger
          );

          assertRight(negotiationResult, e => expect(e).toStrictEqual({ code: '422', headers: [] }));
        });
      });
    });

    describe('and no 422 response exists', () => {
      test('but a 400 response exists', () => {
        httpOperation = anHttpOperation(httpOperation)
          .withResponses([
            {
              code: '400',
              headers: [],
              contents: [
                {
                  mediaType: `${chance.string(chanceOptions)}/${chance.string(chanceOptions)}`,
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

        const actualConfig = helpers.negotiateOptionsForInvalidRequest(httpOperation.responses, ['422', '400'])(logger);
        assertRight(actualConfig, c => expect(c).toHaveProperty('code', '400'));
      });

      test('but a default response exists', () => {
        httpOperation = anHttpOperation(httpOperation)
          .withResponses([
            {
              code: 'default',
              headers: [],
              contents: [
                {
                  mediaType: `${chance.string(chanceOptions)}/${chance.string(chanceOptions)}`,
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

        const actualConfig = helpers.negotiateOptionsForInvalidRequest(httpOperation.responses, ['422', '400'])(logger);
        assertRight(actualConfig, config => expect(config).toHaveProperty('code', '422'));
      });

      test('should return an error', () => {
        assertLeft(helpers.negotiateOptionsForInvalidRequest(httpOperation.responses, ['422', '400'])(logger), error =>
          expect(error).toHaveProperty('message', 'No 422, 400, or default responses defined')
        );
      });
    });
  });

  describe('negotiateOptionsForValidRequest()', () => {
    it('given status code enforced should negotiate a specific code', () => {
      const options = {
        code: '200',
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
        code: '200',
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
      httpOperation = anHttpOperation(httpOperation).withResponses([fakeResponse]).instance();

      const actualOperationConfig = helpers.negotiateOptionsBySpecificCode(httpOperation, desiredOptions, code)(logger);

      expect(negotiateOptionsBySpecificResponseMock).toHaveBeenCalledTimes(1);
      expect(negotiateOptionsBySpecificResponseMock).toHaveBeenCalledWith(
        httpOperation.method,
        desiredOptions,
        fakeResponse
      );
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
      httpOperation = anHttpOperation(httpOperation).withResponses([fakeResponse]).instance();

      const actualOperationConfig = helpers.negotiateOptionsBySpecificCode(httpOperation, desiredOptions, code)(logger);

      expect(negotiateOptionsBySpecificResponseMock).toHaveBeenCalledTimes(1);
      expect(negotiateOptionsBySpecificResponseMock).toHaveBeenCalledWith(
        httpOperation.method,
        desiredOptions,
        fakeResponse
      );
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
        expect(error).toHaveProperty('message', 'The server cannot find the requested content')
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
      httpOperation = anHttpOperation(httpOperation).withResponses([response]).instance();

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
        expect(e.name).toBe('https://stoplight.io/prism/errors#NO_SUCCESS_RESPONSE_DEFINED');
      });
    });
  });

  describe('negotiateOptionsBySpecificResponse()', () => {
    describe('given forced mediaType', () => {
      it('and httpContent exists should negotiate that contents', () => {
        const desiredOptions = {
          mediaTypes: [`${chance.string(chanceOptions)}/${chance.string(chanceOptions)}`],
          dynamic: chance.bool(),
          exampleKey: chance.string(),
        };

        const contents: IMediaTypeContent = {
          mediaType: desiredOptions.mediaTypes[0],
          examples: [],
          encodings: [],
        };

        const httpResponseSchema: IHttpOperationResponse = {
          code: '200',
          contents: [contents],
          headers: [],
        };

        const fakeOperationConfig: IHttpNegotiationResult = {
          code: '200',
          mediaType: desiredOptions.mediaTypes[0],
          headers: [],
        };
        jest.spyOn(helpers, 'negotiateByPartialOptionsAndHttpContent').mockReturnValue(E.right(fakeOperationConfig));
        jest.spyOn(helpers, 'negotiateDefaultMediaType');

        const actualOperationConfig = helpers.negotiateOptionsBySpecificResponse(
          httpOperation.method,
          desiredOptions,
          httpResponseSchema
        )(logger);

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
        assertRight(actualOperationConfig, operationConfig => {
          expect(operationConfig).toEqual(fakeOperationConfig);
        });
      });

      describe('the resource has multiple contents', () => {
        it('should negotiatiate the content according to the preference', () => {
          const desiredOptions: NegotiationOptions & { mediaTypes: string[] } = {
            mediaTypes: ['application/json', 'application/xml'],
            dynamic: false,
          };

          const contents: IMediaTypeContent[] = desiredOptions.mediaTypes.reverse().map(mediaType => ({
            mediaType,
            encodings: [],
            examples: [],
          }));

          const httpResponseSchema: IHttpOperationResponse = {
            code: '200',
            contents,
            headers: [],
          };

          const actualOperationConfig = helpers.negotiateOptionsBySpecificResponse(
            httpOperation.method,
            desiredOptions,
            httpResponseSchema
          )(logger);

          assertRight(actualOperationConfig, config => expect(config).toHaveProperty('mediaType', 'application/xml'));
        });

        it('should negotiatiate the only content that is really available', () => {
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
            code: '200',
            contents: [content],
            headers: [],
          };

          const actualOperationConfig = helpers.negotiateOptionsBySpecificResponse(
            httpOperation.method,
            desiredOptions,
            httpResponseSchema
          )(logger);

          assertRight(actualOperationConfig, config => expect(config).toHaveProperty('mediaType', 'application/json'));
        });
      });

      describe('the response exists, but there is no httpContent', () => {
        const httpResponseSchema: IHttpOperationResponse = {
          code: '200',
          contents: [],
        };

        it('returns an empty payload response', () => {
          const desiredOptions: NegotiationOptions = {
            dynamic: false,
            mediaTypes: ['*/*'],
          };

          const actualResponse = helpers.negotiateOptionsBySpecificResponse(
            httpOperation.method,
            desiredOptions,
            httpResponseSchema
          )(logger);

          assertPayloadlessResponse(actualResponse);
        });

        it('should throw an error', () => {
          const desiredOptions: NegotiationOptions = {
            mediaTypes: [`${chance.string(chanceOptions)}/${chance.string(chanceOptions)}`],
            dynamic: chance.bool(),
            exampleKey: chance.string(),
          };

          const actualResponse = helpers.negotiateOptionsBySpecificResponse(
            httpOperation.method,
            desiredOptions,
            httpResponseSchema
          )(logger);

          expect(E.isLeft(actualResponse)).toBeTruthy();
        });
      });

      describe('the content-type from Accept header cannot be matched', () => {
        it('returns 406', () => {
          const desiredOptions: NegotiationOptions = {
            dynamic: false,
            mediaTypes: ['application/json'],
          };

          const httpResponseSchema: IHttpOperationResponse = {
            code: '200',
            contents: [
              {
                mediaType: 'text/plain',
              },
            ],
          };

          const actualResponse = helpers.negotiateOptionsBySpecificResponse(
            httpOperation.method,
            desiredOptions,
            httpResponseSchema
          )(logger);

          assertLeft(actualResponse, e =>
            expect(e.message).toBe('The server cannot produce a representation for your accept header')
          );
        });
      });
    });

    describe('given no mediaType', () => {
      it('should negotiate default media type', () => {
        const desiredOptions: NegotiationOptions = {
          dynamic: chance.bool(),
          exampleKey: chance.string(),
        };

        const httpResponseSchema: IHttpOperationResponse = {
          code: '200',
          contents: [],
          headers: [],
        };
        const fakeOperationConfig = {
          code: '200',
          mediaType: 'application/json',
          headers: [],
        };

        jest.spyOn(helpers, 'negotiateByPartialOptionsAndHttpContent');
        jest.spyOn(helpers, 'negotiateDefaultMediaType').mockReturnValue(E.right(fakeOperationConfig));

        const actualOperationConfig = helpers.negotiateOptionsBySpecificResponse(
          httpOperation.method,
          desiredOptions,
          httpResponseSchema
        )(logger);

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

        assertRight(actualOperationConfig, operationConfig => {
          expect(operationConfig).toEqual(fakeOperationConfig);
        });
      });
    });
  });

  describe('negotiateDefaultMediaType()', () => {
    describe('default content', () => {
      it.each([
        ['*/*', 'application/xml'],
        ['*/*', 'application/json'],
        ['application/json', 'application/xml'],
      ])('should return %s even when %s is available', (defaultMediaType, alternateMediaType) => {
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

        jest.spyOn(helpers, 'negotiateByPartialOptionsAndHttpContent').mockReturnValue(E.right(fakeOperationConfig));

        const actualOperationConfig = helpers.negotiateDefaultMediaType(partialOptions, response);

        expect(helpers.negotiateByPartialOptionsAndHttpContent).toHaveBeenCalledTimes(1);
        expect(helpers.negotiateByPartialOptionsAndHttpContent).toHaveBeenCalledWith(
          {
            code,
            dynamic: partialOptions.dynamic,
            exampleKey: partialOptions.exampleKey,
          },
          contents[1] // Check that the */* has been requested
        );

        assertRight(actualOperationConfig, operationConfig => {
          expect(operationConfig).toEqual(fakeOperationConfig);
        });
      });
    });

    describe('when no default response', () => {
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

      it('returns text/plain with empty body', () => {
        const negotiationResult = helpers.negotiateDefaultMediaType(partialOptions, response);

        assertRight(negotiationResult, result => {
          expect(result).toEqual(expectedResponse);
        });
      });
    });
  });

  describe('when multiple responses', () => {
    const code = chance.string();
    const partialOptions = { code: '200', dynamic: false };

    describe('and json is among them', () => {
      const negotiationResult = helpers.negotiateDefaultMediaType(partialOptions, {
        code,
        headers: [],
        contents: [
          { mediaType: 'text/plain', examples: [{ key: 'hey', value: {} }] },
          { mediaType: 'application/json', examples: [{ key: 'hey', value: {} }] },
        ],
      });

      it('should give json precedence', () => {
        assertRight(negotiationResult, result => {
          expect(result.mediaType).toEqual('application/json');
        });
      });
    });

    describe('and json is not them', () => {
      const negotiationResult = helpers.negotiateDefaultMediaType(partialOptions, {
        code,
        headers: [],
        contents: [
          { mediaType: 'application/xml', examples: [{ key: 'hey', value: {} }] },
          { mediaType: 'text/plain', examples: [{ key: 'hey', value: {} }] },
        ],
      });

      it('should take the first content type', () => {
        assertRight(negotiationResult, result => {
          expect(result.mediaType).toBe('application/xml');
        });
      });
    });
  });
});

describe('negotiateByPartialOptionsAndHttpContent()', () => {
  describe('given exampleKey forced', () => {
    it('and example exists should return that example', () => {
      const exampleKey = chance.string();
      const partialOptions = {
        code: '200',
        exampleKey,
        dynamic: chance.bool(),
      };
      const bodyExample: INodeExample = {
        key: exampleKey,
        value: '',
      };

      const httpContent: IMediaTypeContent = {
        mediaType: `${chance.string(chanceOptions)}/${chance.string(chanceOptions)}`,
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
        code: '200',
        exampleKey,
        dynamic: chance.bool(),
      };
      const httpContent: IMediaTypeContent = {
        mediaType: `${chance.string(chanceOptions)}/${chance.string(chanceOptions)}`,
        examples: [],
        encodings: [],
      };

      const negotiationResult = helpers.negotiateByPartialOptionsAndHttpContent(partialOptions, httpContent);
      assertLeft(negotiationResult, e => {
        expect(e.message).toBe('The server cannot find the requested content');
      });
    });
  });

  describe('given exampleKey not forced but dynamic forced', () => {
    it('and httpContent has schema return that contents', () => {
      const partialOptions = {
        code: '200',
        dynamic: true,
      };
      const httpContent: IMediaTypeContent = {
        mediaType: `${chance.string(chanceOptions)}/${chance.string(chanceOptions)}`,
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
        code: '200',
        dynamic: true,
      };
      const httpContent: IMediaTypeContent = {
        mediaType: `${chance.string(chanceOptions)}/${chance.string(chanceOptions)}`,
        examples: [],
        encodings: [],
      };

      const negotiationResult = helpers.negotiateByPartialOptionsAndHttpContent(partialOptions, httpContent);

      assertLeft(negotiationResult, e =>
        expect(e.message).toBe(
          `Tried to force a dynamic response for: ${httpContent.mediaType} but schema is not defined.`
        )
      );
    });
  });

  describe('given neither exampleKey nor dynamic forced', () => {
    it('and can find other example return that example', () => {
      const partialOptions = {
        code: '200',
        dynamic: false,
      };
      const bodyExample: INodeExample | INodeExternalExample = {
        key: chance.string(),
        value: '',
        externalValue: '',
      };
      const httpContent: IMediaTypeContent = {
        mediaType: `${chance.string(chanceOptions)}/${chance.string(chanceOptions)}`,
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
        code: '200',
      };
      const httpContent: IMediaTypeContent = {
        mediaType: `${chance.string(chanceOptions)}/${chance.string(chanceOptions)}`,
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
        code: '200',
      };

      const httpContent: IMediaTypeContent = {
        mediaType: `${chance.string(chanceOptions)}/${chance.string(chanceOptions)}`,
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
