import { IPrism } from '@stoplight/prism-core';
import { IHttpOperation } from '@stoplight/types/http-spec';
import { omit } from 'lodash';
import { resolve } from 'path';
import { createInstance, IHttpConfig, IHttpRequest, IHttpResponse } from '../';
import { forwarder } from '../forwarder';

describe('Http Prism Instance function tests', () => {
  let prism: IPrism<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig, { path: string }>;

  it('loads spec provided in yaml', async () => {
    prism = createInstance();
    await prism.load({
      path: resolve(__dirname, 'fixtures', 'petstore.oas2.yaml'),
    });
    expect(prism.resources).toHaveLength(3);
  });

  // TODO is this wanted or expected? We removed similar functionality from the CLI
  it('loading two specs merges them in together...', async () => {
    prism = createInstance();
    await prism.load({
      path: resolve(__dirname, 'fixtures', 'petstore.oas2.yaml'),
    });
    await prism.load({
      path: resolve(__dirname, 'fixtures', 'no-refs-petstore-minimal.oas2.json'),
    });
    expect(prism.resources).toHaveLength(5);
  });

  it('loads spec provided in yaml', async () => {
    prism = createInstance();
    expect(prism.load({ path: 'doesnt-exist.yaml' })).rejects.toThrowError(
      'Non-existing path to spec supplied: doesnt-exist.yaml'
    );
  });

  it('returns stringified static example when one defined in spec', async () => {
    prism = createInstance();
    await prism.load({
      path: resolve(__dirname, 'fixtures', 'static-examples.oas2.json'),
    });

    const response = await prism.process({
      method: 'get',
      url: {
        path: '/todos',
      },
    });

    expect(response.output).toBeDefined();
    expect(typeof response.output!.body).toBe('string');
  });

  describe('when { mock: true } and spec file "no-refs-petstore-minimal.oas2.json" is loaded', () => {
    beforeAll(async () => {
      prism = createInstance({ mock: true }, {});
      await prism.load({
        path: resolve(__dirname, 'fixtures', 'no-refs-petstore-minimal.oas2.json')
      });
    });

    it('errors given incorrect route', () => {
      return expect(
        prism.process({
          method: 'get',
          url: {
            path: '/invalid-route',
          },
        })
      ).rejects.toThrowError('Route not resolved, none path matched');
    });

    it('returns correct response for an existing route', async () => {
      const response = await prism.process({
        method: 'get',
        url: {
          path: '/pet/findByStatus',
          query: {
            status: ['available', 'pending'],
          },
        },
      });
      const parsedBody = JSON.parse(response!.output!.body);
      expect(parsedBody.length).toBeGreaterThan(0);
      parsedBody.forEach((element: any) => {
        expect(typeof element.name).toEqual('string');
        expect(Array.isArray(element.photoUrls)).toBeTruthy();
        expect(element.photoUrls.length).toBeGreaterThan(0);
      });
      // because body is generated randomly
      expect(omit(response, 'output.body')).toMatchSnapshot();
    });

    it('returns validation error for with invalid param', async () => {
      const response = await prism.process({
        method: 'get',
        url: {
          path: '/pet/findByStatus',
        },
      });
      expect(response).toEqual({
        input: {
          method: 'get',
          url: {
            path: '/pet/findByStatus',
          },
        },
        output: {
          body:
            '{"errors":[{"path":["query","status"],"name":"required","summary":"","message":"Missing status query param","severity":"error"}]}',
          headers: {
            'Content-type': 'application/json',
          },
          statusCode: 500,
        },
        validations: {
          input: [
            {
              path: ['query', 'status'],
              name: 'required',
              summary: '',
              message: 'Missing status query param',
              severity: 'error',
            },
          ],
          output: [],
        },
      });
    });

    it('should support collection format multi', async () => {
      const response = await prism.process({
        method: 'get',
        url: {
          path: '/pet/findByStatus',
          query: {
            status: ['sold', 'available'],
          },
        },
      });
      expect(response.validations).toEqual({
        input: [],
        output: [],
      });
    });

    it('support param in body', async () => {
      const response = await prism.process({
        method: 'post',
        url: {
          path: '/store/order',
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

    it("should forward the request correctly even if resources haven't been provided", async () => {
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
  });
});
