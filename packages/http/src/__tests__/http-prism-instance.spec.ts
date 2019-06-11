import { IPrism } from '@stoplight/prism-core';
import { IHttpOperation } from '@stoplight/types/http-spec';
import { relative, resolve } from 'path';
import { createInstance, IHttpConfig, IHttpRequest, IHttpResponse, ProblemJsonError } from '../';
import { forwarder } from '../forwarder';
import { UNPROCESSABLE_ENTITY } from '../mocker/errors';
import { NO_PATH_MATCHED_ERROR } from '../router/errors';

const fixturePath = (filename: string) => relative(process.cwd(), resolve(__dirname, 'fixtures', filename));
const noRefsPetstoreMinimalOas2Path = fixturePath('no-refs-petstore-minimal.oas2.json');
const petStoreOas2Path = fixturePath('petstore.oas2.yaml');
const staticExamplesOas2Path = fixturePath('static-examples.oas2.json');

describe('Http Prism Instance function tests', () => {
  let prism: IPrism<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig, { path: string }>;

  beforeAll(async () => {
    prism = createInstance({ mock: { dynamic: false } }, {});
    await prism.load({ path: noRefsPetstoreMinimalOas2Path });
  });

  test('keeps the instances separate', async () => {
    const secondPrism = createInstance({ mock: { dynamic: false } }, {});
    await secondPrism.load({ path: noRefsPetstoreMinimalOas2Path });

    expect(prism.resources).toStrictEqual(secondPrism.resources);
  });

  test('when processing unknown path throws error', () => {
    return expect(
      prism.process({
        method: 'get',
        url: {
          path: '/unknown-path',
        },
      }),
    ).rejects.toThrowError(ProblemJsonError.fromTemplate(NO_PATH_MATCHED_ERROR));
  });

  describe('when processing GET /pet', () => {
    // TODO will be fixed by https://stoplightio.atlassian.net/browse/SO-260
    xtest('without an optional body parameter expect 200 response', async () => {
      const response = await prism.process({
        method: 'get',
        url: { path: '/pet' },
      });

      expect(response.output!.statusCode).toEqual(200);
    });
  });

  describe('when processing GET /pet/findByStatus', () => {
    test('with valid query params returns generated body', async () => {
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

    test('w/o required params throws a validation error', () => {
      return expect(
        prism.process({
          method: 'get',
          url: {
            path: '/pet/findByStatus',
          },
        }),
      ).rejects.toThrowError(ProblemJsonError.fromTemplate(UNPROCESSABLE_ENTITY));
    });

    test('with valid body param then returns no validation issues', async () => {
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
    xtest('with invalid body returns validation errors', () => {
      return expect(
        prism.process({
          method: 'get',
          url: {
            path: '/pet/findByStatus',
            query: {
              status: ['available'],
            },
          },
          body: {
            id: 'should not be a string',
            status: 'should be one of "placed", "approved", "delivered"',
            complete: 'should be a boolean',
          },
        }),
      ).rejects.toThrowError(ProblemJsonError.fromTemplate(UNPROCESSABLE_ENTITY));
    });
  });

  test("should forward the request correctly even if resources haven't been provided", async () => {
    // Recreate Prism with no loaded document
    prism = createInstance(undefined, { forwarder, router: undefined, mocker: undefined });

    const response = await prism.process({
      method: 'post',
      url: {
        path: '/store/order',
        baseUrl: 'https://petstore.swagger.io',
      },
      body: {
        id: 1,
        petId: 2,
        quantity: 3,
        shipDate: '12-01-2018',
        status: 'placed',
        complete: true,
      },
    });

    expect(response.validations).toEqual({
      input: [],
      output: [],
    });
  });

  test('loads spec provided in yaml', async () => {
    prism = createInstance();
    await prism.load({ path: petStoreOas2Path });

    expect(prism.resources).toHaveLength(3);
  });

  test('returns stringified static example when one defined in spec', async () => {
    prism = createInstance();
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
