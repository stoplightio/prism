import { createLogger, IPrism } from '@stoplight/prism-core';
import { DiagnosticSeverity } from '@stoplight/types';
import { IHttpOperation } from '@stoplight/types';
import * as nock from 'nock';
import { basename, resolve } from 'path';
import { createInstance, IHttpConfig, IHttpRequest, IHttpResponse, ProblemJsonError } from '../';
import { UNPROCESSABLE_ENTITY } from '../mocker/errors';
import { NO_BASE_URL_ERROR, NO_PATH_MATCHED_ERROR, NO_SERVER_MATCHED_ERROR } from '../router/errors';

const logger = createLogger('TEST', { enabled: false });

const fixturePath = (filename: string) => resolve(__dirname, 'fixtures', filename);
const noRefsPetstoreMinimalOas2Path = fixturePath('no-refs-petstore-minimal.oas2.json');
const petStoreOas2Path = fixturePath('petstore.oas2.yaml');
const staticExamplesOas2Path = fixturePath('static-examples.oas2.json');
const serverValidationOas2Path = fixturePath('server-validation.oas2.json');
const serverValidationOas3Path = fixturePath('server-validation.oas3.json');

describe('Http Client .process', () => {
  let prism: IPrism<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig, { path: string }>;

  describe.each`
    specName                              | specPath
    ${basename(serverValidationOas2Path)} | ${serverValidationOas2Path}
    ${basename(serverValidationOas3Path)} | ${serverValidationOas3Path}
  `('given spec $specName', ({ specPath }) => {
    beforeAll(async () => {
      prism = createInstance({ mock: { dynamic: false } }, { logger });
      await prism.load({ path: specPath });
    });

    describe('baseUrl not set', () => {
      it('ignores server validation and returns 200', async () => {
        const result = await prism.process({
          method: 'get',
          url: {
            path: '/pet',
          },
        });

        expect(result.output).toBeDefined();
        expect(result.output!.statusCode).toBe(200);
      });
    });

    describe('valid baseUrl set', () => {
      it('validates server and returns 200', async () => {
        const result = await prism.process({
          method: 'get',
          url: {
            path: '/pet',
            baseUrl: 'http://example.com/api',
          },
        });

        expect(result.output).toBeDefined();
        expect(result.output!.statusCode).toBe(200);
      });
    });

    describe('invalid host of baseUrl set', () => {
      it('throws an error', () => {
        return expect(
          prism.process({
            method: 'get',
            url: {
              path: '/pet',
              baseUrl: 'http://acme.com/api',
            },
          }),
        ).rejects.toThrowError(ProblemJsonError.fromTemplate(NO_SERVER_MATCHED_ERROR));
      });
    });

    describe('invalid host and basePath of baseUrl set', () => {
      it('throws an error', () => {
        return expect(
          prism.process({
            method: 'get',
            url: {
              path: '/pet',
              baseUrl: 'http://example.com/v1',
            },
          }),
        ).rejects.toThrowError(ProblemJsonError.fromTemplate(NO_SERVER_MATCHED_ERROR));
      });
    });

    describe('mocking is off', () => {
      const config: IHttpConfig = { mock: false };
      const baseUrl = 'http://stoplight.io';
      const serverReply = 'hello world';

      beforeEach(() => {
        nock(baseUrl)
          .get('/x-bet')
          .reply(200, serverReply);
      });

      afterEach(() => {
        nock.cleanAll();
      });

      describe('path is not valid', () => {
        const request: IHttpRequest = {
          method: 'get',
          url: {
            path: '/x-bet',
            baseUrl,
          },
        };

        it('returns input warning', async () => {
          const result = await prism.process(request, config);

          expect(result.validations.input).toEqual([
            {
              code: 404,
              source: 'https://stoplight.io/prism/errors#NO_PATH_MATCHED_ERROR',
              message: 'Route not resolved, no path matched.',
              severity: DiagnosticSeverity.Warning,
            },
          ]);
        });

        it('makes a http request anyway', async () => {
          // note that we are 'nocking' the request in beforeEach
          const result = await prism.process(request, config);

          expect(result.output).toBeDefined();
          expect(result.output!.statusCode).toEqual(200);
          expect(result.output!.body).toEqual(serverReply);
        });

        describe('baseUrl is not set', () => {
          it('throws an error', () => {
            return expect(
              prism.process(
                {
                  method: 'get',
                  url: {
                    path: '/x-pet',
                  },
                },
                config,
              ),
            ).rejects.toThrowError(ProblemJsonError.fromTemplate(NO_BASE_URL_ERROR));
          });
        });
      });

      describe('path is valid and baseUrl is not set', () => {
        it('fallbacks to a server from the spec', async () => {
          const oasBaseUrl = 'http://example.com/api';
          const reply = 'some demo reply';
          nock(oasBaseUrl)
            .get('/pet')
            .reply(200, reply);

          const result = await prism.process(
            {
              method: 'get',
              url: {
                path: '/pet',
              },
            },
            config,
          );

          expect(result.output).toBeDefined();
          expect(result.output!.statusCode).toEqual(200);
          expect(result.output!.body).toEqual(reply);
        });
      });
    });
  });

  describe('given no-refs-petstore-minimal.oas2.json', () => {
    beforeAll(async () => {
      prism = createInstance({ mock: { dynamic: false } }, { logger });
      await prism.load({ path: noRefsPetstoreMinimalOas2Path });
    });

    it('keeps the instances separate', async () => {
      const secondPrism = createInstance({ mock: { dynamic: false } }, { logger });
      await secondPrism.load({ path: noRefsPetstoreMinimalOas2Path });

      expect(prism.resources).toStrictEqual(secondPrism.resources);
    });

    describe('path is invalid', () => {
      it('throws an error', () => {
        return expect(
          prism.process({
            method: 'get',
            url: {
              path: '/unknown-path',
            },
          }),
        ).rejects.toThrowError(ProblemJsonError.fromTemplate(NO_PATH_MATCHED_ERROR));
      });
    });

    // TODO will be fixed by https://stoplightio.atlassian.net/browse/SO-260
    test.todo('GET /pet without an optional body parameter');

    describe('when processing GET /pet/findByStatus', () => {
      it('with valid query params returns generated body', async () => {
        const response = await prism.process({
          method: 'get',
          url: {
            path: '/pet/findByStatus',
            query: {
              status: ['available', 'pending'],
            },
          },
        });

        const parsedBody = response!.output!.body;

        expect(typeof parsedBody).toBe('string');
        expect(response).toMatchSnapshot({
          output: {
            body: expect.anything(),
          },
        });
      });

      it('w/o required params throws a validation error', () => {
        return expect(
          prism.process({
            method: 'get',
            url: {
              path: '/pet/findByStatus',
            },
          }),
        ).rejects.toThrowError(ProblemJsonError.fromTemplate(UNPROCESSABLE_ENTITY));
      });

      it('with valid body param then returns no validation issues', async () => {
        const response = await prism.process({
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
        });
        expect(response.validations).toEqual({
          input: [],
          output: [],
        });
      });

      // TODO: will be fixed by https://stoplightio.atlassian.net/browse/SO-259
      test.todo('with invalid body returns validation errors');
    });
  });

  describe('headers validation', () => {
    it('validates the headers even if casing does not match', async () => {
      const response = await prism.process({
        method: 'get',
        url: {
          path: '/pet/login',
        },
        headers: {
          aPi_keY: 'hello',
        },
      });

      expect(response.output).toHaveProperty('statusCode', 200);
    });

    it('returns an error if the the header is missing', () => {
      return expect(
        prism.process({
          method: 'get',
          url: {
            path: '/pet/login',
          },
        }),
      ).rejects.toThrowError();
    });
  });

  it('loads spec provided in yaml', async () => {
    prism = createInstance(undefined, { logger });
    await prism.load({ path: petStoreOas2Path });

    expect(prism.resources).toHaveLength(3);
  });

  it('returns stringified static example when one defined in spec', async () => {
    prism = createInstance(undefined, { logger });
    await prism.load({ path: staticExamplesOas2Path });

    const response = await prism.process({
      method: 'get',
      url: {
        path: '/todos',
      },
    });

    expect(response.output).toBeDefined();
    expect(response.output!.body).toBeInstanceOf(Array);
  });
});
