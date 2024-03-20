import { createLogger, IPrismOutput } from '@stoplight/prism-core';
import { basename, resolve } from 'path';
import { IHttpRequest, IHttpResponse, ProblemJsonError } from '../';
import { UNPROCESSABLE_ENTITY } from '../mocker/errors';
import { NO_PATH_MATCHED_ERROR, NO_SERVER_MATCHED_ERROR } from '../router/errors';
import { createAndCallPrismInstanceWithSpec } from '../instanceWithSpec';
import { IHttpConfig } from '../types';

const logger = createLogger('TEST', { enabled: false });

const fixturePath = (filename: string) => resolve(__dirname, 'fixtures', filename);
const noRefsPetstoreMinimalOas2Path = fixturePath('no-refs-petstore-minimal.oas2.json');
const staticExamplesOas2Path = fixturePath('static-examples.oas2.json');
const serverValidationOas2Path = fixturePath('server-validation.oas2.json');
const serverValidationOas3Path = fixturePath('server-validation.oas3.json');

let config: IHttpConfig = {
  validateRequest: true,
  checkSecurity: true,
  validateResponse: true,
  mock: { dynamic: false },
  errors: false,
  upstreamProxy: undefined,
  isProxy: false,
};

describe('Http Client .request', () => {
  describe.each`
    specName                              | specPath
    ${basename(serverValidationOas2Path)} | ${serverValidationOas2Path}
    ${basename(serverValidationOas3Path)} | ${serverValidationOas3Path}
  `('given spec $specName', ({ specPath }) => {
    describe('baseUrl not set', () => {
      it('ignores server validation and returns 200', async () => {
        const prismRequest: IHttpRequest = {
          method: 'get',
          url: {
            path: '/pet',
          },
        };
        const result = (await createAndCallPrismInstanceWithSpec(
          specPath,
          config,
          prismRequest,
          logger
        )) as unknown as IPrismOutput<IHttpResponse>;
        expect(result.output).toBeDefined();
        expect(result.output.statusCode).toBe(200);
      });
    });
    describe('valid baseUrl set', () => {
      it('validates server and returns 200', async () => {
        const prismRequest: IHttpRequest = {
          method: 'get',
          url: {
            path: '/pet',
            baseUrl: 'http://example.com/api',
          },
        };
        const result = (await createAndCallPrismInstanceWithSpec(
          specPath,
          config,
          prismRequest,
          logger
        )) as unknown as IPrismOutput<IHttpResponse>;
        expect(result.output).toBeDefined();
        expect(result.output.statusCode).toBe(200);
      });
    });

    describe('invalid host of baseUrl set', () => {
      it('resolves with an error', async () => {
        const prismRequest: IHttpRequest = {
          method: 'get',
          url: {
            path: '/pet',
            baseUrl: 'http://acme.com/api',
          },
        };
        const result = await createAndCallPrismInstanceWithSpec(specPath, config, prismRequest, logger);
        const resultJson = JSON.parse(result as string);
        const expectedError = ProblemJsonError.fromTemplate(NO_SERVER_MATCHED_ERROR);
        expect(ProblemJsonError.fromTemplate(resultJson)).toMatchObject(expectedError);
      });
    });

    describe('invalid host and basePath of baseUrl set', () => {
      it('resolves with an error', async () => {
        const prismRequest: IHttpRequest = {
          method: 'get',
          url: {
            path: '/pet',
            baseUrl: 'http://example.com/v1',
          },
        };
        const result = await createAndCallPrismInstanceWithSpec(specPath, config, prismRequest, logger);
        const resultJson = JSON.parse(result as string);
        const expectedError = ProblemJsonError.fromTemplate(NO_SERVER_MATCHED_ERROR);
        expect(ProblemJsonError.fromTemplate(resultJson)).toMatchObject(expectedError);
      });
    });

    describe('mocking is off', () => {
      const baseUrl = 'https://stoplight.io';

      describe.each<[boolean, string]>([
        [false, 'will let the request go through'],
        [true, 'fails the operation'],
      ])('errors flag is %s', (errors, testText) => {
        config = {
          mock: { dynamic: false },
          checkSecurity: true,
          validateRequest: true,
          validateResponse: true,
          errors,
          upstream: new URL(baseUrl),
          upstreamProxy: undefined,
          isProxy: true,
        };

        describe('path is not valid', () => {
          const request: IHttpRequest = {
            method: 'get',
            url: {
              path: '/x-bet',
              baseUrl,
            },
          };

          it(testText, async () => {
            const result = await createAndCallPrismInstanceWithSpec(specPath, config, request, logger);
            if (typeof result === 'string') {
              const resultJson = JSON.parse(result);
              const expectedError = ProblemJsonError.fromTemplate(NO_PATH_MATCHED_ERROR);
              expect(ProblemJsonError.fromTemplate(resultJson)).toMatchObject(expectedError);
            } else {
              expect(result.output).toBeDefined();
              expect(result.output.statusCode).toBe(200);
            }
          });
        });
      });
    });
  });

  describe('given no-refs-petstore-minimal.oas2.json', () => {
    config = {
      checkSecurity: true,
      validateRequest: true,
      validateResponse: true,
      mock: { dynamic: false },
      errors: false,
      upstreamProxy: undefined,
      isProxy: false,
    };
    const specPath = noRefsPetstoreMinimalOas2Path;
    describe('path is invalid', () => {
      it('resolves with an error', async () => {
        const request: IHttpRequest = {
          method: 'get',
          url: {
            path: '/unknown-path',
          },
        };
        const result = await createAndCallPrismInstanceWithSpec(specPath, config, request, logger);
        const resultJson = JSON.parse(result as string);
        const expectedError = ProblemJsonError.fromTemplate(NO_PATH_MATCHED_ERROR);
        expect(ProblemJsonError.fromTemplate(resultJson)).toMatchObject(expectedError);
      });
    });

    describe('when requesting GET /pet/findByStatus', () => {
      it('with valid query params returns generated body', async () => {
        const request: IHttpRequest = {
          method: 'get',
          url: {
            path: '/pet/findByStatus',
            query: {
              status: ['available', 'pending'],
            },
          },
        };
        const result = (await createAndCallPrismInstanceWithSpec(
          specPath,
          config,
          request,
          logger
        )) as unknown as IPrismOutput<IHttpResponse>;
        expect(result).toHaveProperty('output.body');
        expect(typeof result.output.body).toBe('string');
      });

      it('w/o required params throws a validation error', async () => {
        const request: IHttpRequest = {
          method: 'get',
          url: {
            path: '/pet/findByStatus',
          },
        };
        const result = await createAndCallPrismInstanceWithSpec(specPath, config, request, logger);
        const resultJson = JSON.parse(result as string);
        const expectedError = ProblemJsonError.fromTemplate(UNPROCESSABLE_ENTITY);
        expect(ProblemJsonError.fromTemplate(resultJson)).toMatchObject(expectedError);
      });

      it('with valid body param then returns no validation issues', async () => {
        const request: IHttpRequest = {
          method: 'get',
          url: {
            path: '/pet/findByStatus',
            query: {
              status: ['available'],
            },
          },
          body: {
            id: 1,
            status: 'placed',
            complete: true,
          },
        };
        const result = (await createAndCallPrismInstanceWithSpec(
          specPath,
          config,
          request,
          logger
        )) as unknown as IPrismOutput<IHttpResponse>;
        expect(result.validations).toEqual({
          input: [],
          output: [],
        });
      });
    });
  });

  describe('headers validation', () => {
    it('validates the headers even if casing does not match', async () => {
      const request: IHttpRequest = {
        method: 'get',
        url: {
          path: '/pet/login',
        },
        headers: {
          aPi_keY: 'hello',
        },
      };
      const result = (await createAndCallPrismInstanceWithSpec(
        noRefsPetstoreMinimalOas2Path,
        config,
        request,
        logger
      )) as unknown as IPrismOutput<IHttpResponse>;
      expect(result).toBeDefined();
      expect(result.output).toHaveProperty('statusCode', 200);
    });

    it('returns an error if the the header is missing', async () => {
      const request: IHttpRequest = {
        method: 'get',
        url: {
          path: '/pet/login',
        },
      };
      const result = await createAndCallPrismInstanceWithSpec(noRefsPetstoreMinimalOas2Path, config, request, logger);
      const resultJson = JSON.parse(result as string);
      const expectedError = ProblemJsonError.fromTemplate(UNPROCESSABLE_ENTITY);
      expect(ProblemJsonError.fromTemplate(resultJson)).toMatchObject(expectedError);
    });
  });

  it('returns stringified static example when one defined in spec', async () => {
    config = {
      mock: { dynamic: false },
      checkSecurity: true,
      validateRequest: true,
      validateResponse: true,
      errors: false,
      upstreamProxy: undefined,
      isProxy: false,
    };
    const request: IHttpRequest = {
      method: 'get',
      url: {
        path: '/todos',
      },
    };
    const result = (await createAndCallPrismInstanceWithSpec(
      staticExamplesOas2Path,
      config,
      request,
      logger
    )) as unknown as IPrismOutput<IHttpResponse>;
    expect(result.output).toBeDefined();
    expect(result.output.body).toBeInstanceOf(Array);
  });
});
