import { createLogger, IPrism } from '@stoplight/prism-core';
import { IHttpOperation } from '@stoplight/types';
import { Scope as NockScope } from 'nock';
import * as nock from 'nock';
import { basename, resolve } from 'path';
import { createInstance, IHttpProxyConfig, IHttpRequest, IHttpResponse, ProblemJsonError } from '../';
import { getHttpOperationsFromResource } from '../getHttpOperations';
import { UNPROCESSABLE_ENTITY } from '../mocker/errors';
import { NO_PATH_MATCHED_ERROR, NO_SERVER_MATCHED_ERROR } from '../router/errors';
import { assertResolvesRight, assertResolvesLeft } from '@stoplight/prism-core/src/__tests__/utils';

const logger = createLogger('TEST', { enabled: false });

const fixturePath = (filename: string) => resolve(__dirname, 'fixtures', filename);
const noRefsPetstoreMinimalOas2Path = fixturePath('no-refs-petstore-minimal.oas2.json');
const petStoreOas2Path = fixturePath('petstore.oas2.yaml');
const staticExamplesOas2Path = fixturePath('static-examples.oas2.json');
const serverValidationOas2Path = fixturePath('server-validation.oas2.json');
const serverValidationOas3Path = fixturePath('server-validation.oas3.json');

const { version: prismVersion } = require('../../package.json');

type Prism = IPrism<IHttpOperation, IHttpRequest, IHttpResponse, IHttpProxyConfig>;
type NockResWithInterceptors = NockScope & { interceptors: Array<{ req: { headers: string[] } }> };

async function checkUserAgent(
  config: IHttpProxyConfig,
  prism: Prism,
  resources: IHttpOperation[],
  headers = {},
  oasBaseUrl: string
) {
  const nockResult = nock(oasBaseUrl).get('/pet').reply(200);

  await prism.request(
    {
      method: 'get',
      url: {
        path: '/pet',
      },
      headers,
    },
    resources,
    config
  )();

  return (nockResult as NockResWithInterceptors).interceptors['0'].req.headers['user-agent'];
}

describe('Http Client .request', () => {
  let prism: Prism;
  let resources: IHttpOperation[];
  describe.each`
    specName                              | specPath
    ${basename(serverValidationOas2Path)} | ${serverValidationOas2Path}
    ${basename(serverValidationOas3Path)} | ${serverValidationOas3Path}
  `('given spec $specName', ({ specPath }) => {
    beforeAll(async () => {
      prism = createInstance(
        { validateRequest: true, checkSecurity: true, validateResponse: true, mock: { dynamic: false }, errors: false },
        { logger }
      );
      resources = await getHttpOperationsFromResource(specPath);
    });

    describe('baseUrl not set', () => {
      it('ignores server validation and returns 200', () =>
        assertResolvesRight(
          prism.request(
            {
              method: 'get',
              url: {
                path: '/pet',
              },
            },
            resources
          ),
          result => {
            expect(result.output).toBeDefined();
            expect(result.output.statusCode).toBe(200);
          }
        ));
    });

    describe('valid baseUrl set', () => {
      it('validates server and returns 200', () =>
        assertResolvesRight(
          prism.request(
            {
              method: 'get',
              url: {
                path: '/pet',
                baseUrl: 'http://example.com/api',
              },
            },
            resources
          ),
          result => {
            expect(result.output).toBeDefined();
            expect(result.output.statusCode).toBe(200);
          }
        ));
    });

    describe('invalid host of baseUrl set', () => {
      it('resolves with an error', () =>
        assertResolvesLeft(
          prism.request(
            {
              method: 'get',
              url: {
                path: '/pet',
                baseUrl: 'http://acme.com/api',
              },
            },
            resources
          ),
          e => expect(e).toMatchObject(ProblemJsonError.fromTemplate(NO_SERVER_MATCHED_ERROR))
        ));
    });

    describe('invalid host and basePath of baseUrl set', () => {
      it('resolves with an error', () =>
        assertResolvesLeft(
          prism.request(
            {
              method: 'get',
              url: {
                path: '/pet',
                baseUrl: 'http://example.com/v1',
              },
            },
            resources
          ),
          e => expect(e).toMatchObject(ProblemJsonError.fromTemplate(NO_SERVER_MATCHED_ERROR))
        ));
    });

    describe('mocking is off', () => {
      const baseUrl = 'https://stoplight.io';
      const serverReply = 'hello world';

      beforeEach(() => {
        nock(baseUrl).get('/x-bet').reply(200, serverReply);
      });

      afterEach(() => nock.cleanAll());

      describe.each<[boolean, string]>([
        [false, 'will let the request go through'],
        [true, 'fails the operation'],
      ])('errors flag is %s', (errors, testText) => {
        const config: IHttpProxyConfig = {
          mock: false,
          checkSecurity: true,
          validateRequest: true,
          validateResponse: true,
          errors,
          upstream: new URL(baseUrl),
        };

        describe('path is not valid', () => {
          const request: IHttpRequest = {
            method: 'get',
            url: {
              path: '/x-bet',
              baseUrl,
            },
          };

          it(testText, () => {
            const op = prism.request(request, resources, config);
            return errors
              ? assertResolvesLeft(op, e =>
                  expect(e).toMatchObject(ProblemJsonError.fromTemplate(NO_PATH_MATCHED_ERROR))
                )
              : assertResolvesRight(op);
          });
        });
      });

      describe('Prism user-agent header', () => {
        const config: IHttpProxyConfig = {
          mock: false,
          checkSecurity: true,
          validateRequest: true,
          validateResponse: true,
          errors: false,
          upstream: new URL(baseUrl),
        };

        describe('when the defaults are used', () => {
          it('should use Prism/<<version>> for the header', async () => {
            const userAgent = await checkUserAgent(config, prism, resources, {}, 'https://stoplight.io');

            expect(userAgent[0]).toBe(`Prism/${prismVersion}`);
          });
        });

        describe('when user-agent is being overwritten', () => {
          it('should have user specified string as the header', async () => {
            const userAgent = await checkUserAgent(
              config,
              prism,
              resources,
              {
                'user-agent': 'Other_Agent/1.0.0',
              },
              'https://stoplight.io'
            );

            expect(userAgent[0]).toBe('Other_Agent/1.0.0');
          });
        });
      });
    });
  });

  describe('given no-refs-petstore-minimal.oas2.json', () => {
    beforeAll(async () => {
      prism = createInstance(
        { checkSecurity: true, validateRequest: true, validateResponse: true, mock: { dynamic: false }, errors: false },
        { logger }
      );
      resources = await getHttpOperationsFromResource(noRefsPetstoreMinimalOas2Path);
    });

    describe('path is invalid', () => {
      it('resolves with an error', () =>
        assertResolvesLeft(
          prism.request(
            {
              method: 'get',
              url: {
                path: '/unknown-path',
              },
            },
            resources
          ),
          e => expect(e).toMatchObject(ProblemJsonError.fromTemplate(NO_PATH_MATCHED_ERROR))
        ));
    });

    describe('when requesting GET /pet/findByStatus', () => {
      it('with valid query params returns generated body', () =>
        assertResolvesRight(
          prism.request(
            {
              method: 'get',
              url: {
                path: '/pet/findByStatus',
                query: {
                  status: ['available', 'pending'],
                },
              },
            },
            resources
          ),
          response => {
            expect(response).toHaveProperty('output.body');
            expect(typeof response.output.body).toBe('string');
          }
        ));

      it('w/o required params throws a validation error', () =>
        assertResolvesLeft(
          prism.request(
            {
              method: 'get',
              url: {
                path: '/pet/findByStatus',
              },
            },
            resources
          ),
          e => expect(e).toMatchObject(ProblemJsonError.fromTemplate(UNPROCESSABLE_ENTITY))
        ));

      it('with valid body param then returns no validation issues', () =>
        assertResolvesRight(
          prism.request(
            {
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
            },
            resources
          ),
          response =>
            expect(response.validations).toEqual({
              input: [],
              output: [],
            })
        ));
    });
  });

  describe('headers validation', () => {
    it('validates the headers even if casing does not match', () =>
      assertResolvesRight(
        prism.request(
          {
            method: 'get',
            url: {
              path: '/pet/login',
            },
            headers: {
              aPi_keY: 'hello',
            },
          },
          resources
        ),
        response => expect(response.output).toHaveProperty('statusCode', 200)
      ));

    it('returns an error if the the header is missing', () =>
      assertResolvesLeft(
        prism.request(
          {
            method: 'get',
            url: {
              path: '/pet/login',
            },
          },
          resources
        )
      ));
  });

  it('loads spec provided in yaml', () => {
    return expect(getHttpOperationsFromResource(petStoreOas2Path)).resolves.toHaveLength(3);
  });

  it('returns stringified static example when one defined in spec', async () => {
    prism = createInstance(
      { mock: { dynamic: false }, checkSecurity: true, validateRequest: true, validateResponse: true, errors: false },
      { logger }
    );
    resources = await getHttpOperationsFromResource(staticExamplesOas2Path);

    return assertResolvesRight(
      prism.request(
        {
          method: 'get',
          url: {
            path: '/todos',
          },
        },
        resources
      ),
      response => {
        expect(response.output).toBeDefined();
        expect(response.output.body).toBeInstanceOf(Array);
      }
    );
  });
});

describe('proxy server', () => {
  const baseUrl = 'https://petstore.swagger.io:7777/v2';

  beforeAll(() =>
    nock(baseUrl).get('/pets').reply(200, '<html><h1>Hello</h1>', { 'content-type': 'application/html' })
  );

  afterAll(() => nock.cleanAll());

  describe('when the base URL has a different port', () => {
    it('will take in account when proxying', async () => {
      const prism = createInstance(
        {
          mock: false,
          checkSecurity: true,
          validateRequest: true,
          validateResponse: true,
          upstream: new URL(baseUrl),
          errors: false,
        },
        { logger }
      );

      const resources = await getHttpOperationsFromResource(petStoreOas2Path);
      return assertResolvesRight(prism.request({ method: 'get', url: { path: '/pets' } }, resources), response => {
        expect(response.output.statusCode).toBe(200);
        expect(response.output.body).toBe('<html><h1>Hello</h1>');
      });
    });
  });
});
