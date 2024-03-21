import { createLogger } from '@stoplight/prism-core';
import { basename, resolve } from 'path';
import { IHttpRequest, ProblemJsonError } from '../';
import { UNPROCESSABLE_ENTITY } from '../mocker/errors';
import { NO_PATH_MATCHED_ERROR, NO_SERVER_MATCHED_ERROR } from '../router/errors';
import { createAndCallPrismInstanceWithSpec, PrismErrorResult, PrismOkResult } from '../instanceWithSpec';
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
        const result = await createAndCallPrismInstanceWithSpec(specPath, config, prismRequest, logger);
        expect(result.result).toBe('ok');
        const output = (result as PrismOkResult).response.output;
        expect(output).toBeDefined();
        expect(output.statusCode).toBe(200);
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
        const result = await createAndCallPrismInstanceWithSpec(specPath, config, prismRequest, logger);
        expect(result.result).toBe('ok');
        const output = (result as PrismOkResult).response.output;
        expect(output).toBeDefined();
        expect(output.statusCode).toBe(200);
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
        expect(result.result).toBe('error');
        expect((result as PrismErrorResult).error).toMatchObject(
          ProblemJsonError.fromTemplate(NO_SERVER_MATCHED_ERROR)
        );
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
        expect(result.result).toBe('error');
        expect((result as PrismErrorResult).error).toMatchObject(
          ProblemJsonError.fromTemplate(NO_SERVER_MATCHED_ERROR)
        );
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
        expect(result.result).toBe('error');
        expect((result as PrismErrorResult).error).toMatchObject(ProblemJsonError.fromTemplate(NO_PATH_MATCHED_ERROR));
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
        const result = await createAndCallPrismInstanceWithSpec(specPath, config, request, logger);
        expect(result.result).toBe('ok');
        const response = (result as PrismOkResult).response;
        expect(response).toHaveProperty('output.body');
        expect(typeof response.output.body).toBe('string');
      });

      it('w/o required params throws a validation error', async () => {
        const request: IHttpRequest = {
          method: 'get',
          url: {
            path: '/pet/findByStatus',
          },
        };
        const result = await createAndCallPrismInstanceWithSpec(specPath, config, request, logger);
        expect(result.result).toBe('error');
        expect((result as PrismErrorResult).error).toMatchObject(ProblemJsonError.fromTemplate(UNPROCESSABLE_ENTITY));
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
        const result = await createAndCallPrismInstanceWithSpec(specPath, config, request, logger);
        expect(result.result).toBe('ok');
        expect((result as PrismOkResult).response.validations).toEqual({
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
      const result = await createAndCallPrismInstanceWithSpec(noRefsPetstoreMinimalOas2Path, config, request, logger);
      expect(result).toBeDefined();
      expect(result.result).toBe('ok');
      expect((result as PrismOkResult).response.output).toHaveProperty('statusCode', 200);
    });

    it('returns an error if the the header is missing', async () => {
      const request: IHttpRequest = {
        method: 'get',
        url: {
          path: '/pet/login',
        },
      };
      const result = await createAndCallPrismInstanceWithSpec(noRefsPetstoreMinimalOas2Path, config, request, logger);
      expect(result.result).toBe('error');
      expect((result as PrismErrorResult).error).toMatchObject(ProblemJsonError.fromTemplate(UNPROCESSABLE_ENTITY));
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
    const result = await createAndCallPrismInstanceWithSpec(staticExamplesOas2Path, config, request, logger);
    expect(result.result).toBe('ok');
    const output = (result as PrismOkResult).response.output;
    expect(output).toBeDefined();
    expect(output.body).toBeInstanceOf(Array);
  });
});
