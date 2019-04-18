import { relative, resolve } from 'path';
import { createServer } from '../';
import { IPrismHttpServer } from '../types';

describe.each([['petstore.oas2.json'], ['petstore.oas3.json']])('server %s', file => {
  let server: IPrismHttpServer<{}>;

  beforeAll(async () => {
    server = createServer({}, { components: {}, config: { mock: true } });
    await server.prism.load({
      path: relative(process.cwd(), resolve(__dirname, '..', '..', '..', '..', 'examples', file)),
    });
  });

  afterAll(() => server.fastify.close());

  test('should mock back /pets/:petId', async () => {
    const response = await server.fastify.inject({
      method: 'GET',
      url: '/pets/123',
    });

    expect(response.statusCode).toBe(200);

    const payload = JSON.parse(response.payload);
    expect(payload).toHaveProperty('id');
    expect(payload).toHaveProperty('category');
    expect(payload).toHaveProperty('name');
    expect(payload).toHaveProperty('photoUrls');
    expect(payload).toHaveProperty('tags');
    expect(payload).toHaveProperty('status');
  });

  test('should not mock a verb that is not defined on a path', async () => {
    const response = await server.fastify.inject({
      method: 'POST',
      url: '/pets/123',
    });
    expect(response.statusCode).toBe(500);
  });

  test('will return requested response using the __code property', async () => {
    const response = await server.fastify.inject({
      method: 'GET',
      url: '/pets/123?__code=404',
    });

    expect(response.statusCode).toBe(404);
    expect(response.payload).toBe('');
  });

  test('will return requested error response with payload', async () => {
    const response = await server.fastify.inject({
      method: 'GET',
      url: '/pets/123?__code=418',
    });

    expect(response.statusCode).toBe(418);

    const payload = JSON.parse(response.payload);
    expect(payload).toHaveProperty('name');
  });

  test('should not mock a request that is missing the required query parameters with no default', async () => {
    const response = await server.fastify.inject({
      method: 'GET',
      url: '/pets/findByTags',
    });

    expect(response.statusCode).toBe(400);
  });

  test.skip('should automagically provide the parameters when not provided in the query string and a default is defined', async () => {
    const response = await server.fastify.inject({
      method: 'GET',
      url: '/pets/findByStatus',
    });

    expect(response.statusCode).toBe(200);
  });

  test('should support multiple param values', async () => {
    const response = await server.fastify.inject({
      method: 'GET',
      url: '/pets/findByStatus?status=available&status=sold',
    });

    expect(response.statusCode).toBe(200);
  });

  test('should default to 200 and mock from schema', async () => {
    const response = await server.fastify.inject({
      method: 'GET',
      url: '/user/username',
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.payload);
    expect(payload).toHaveProperty('id');
    expect(payload).toHaveProperty('username');
    expect(payload).toHaveProperty('firstName');
    expect(payload).toHaveProperty('lastName');
    expect(payload).toHaveProperty('email');
    expect(payload).toHaveProperty('password');
    expect(payload).toHaveProperty('phone');
    expect(payload).toHaveProperty('userStatus');
  });

  test('should validate body params', async () => {
    const response = await server.fastify.inject({
      method: 'POST',
      url: '/store/order',
      payload: {
        id: 1,
        petId: 2,
        quantity: 3,
        shipDate: '2002-10-02T10:00:00-05:00',
        status: 'placed',
        complete: true,
      },
    });

    expect(response.statusCode).toBe(200);
  });

  test('should validate the body params and return an error code', async () => {
    const response = await server.fastify.inject({
      method: 'POST',
      url: '/pets',
      payload: {
        id: 1,
        petId: 2,
        quantity: 3,
        shipDate: '12-01-2018',
        status: 'placed',
        complete: true,
      },
    });
    expect(response.statusCode).toBe(400);
  });

  test('will return the default response when using the __code property with a non existing code', async () => {
    const response = await server.fastify.inject({
      method: 'GET',
      url: '/pets/123?__code=499',
    });

    expect(response.statusCode).toBe(499);
    const payload = JSON.parse(response.payload);
    expect(payload).toHaveProperty('code');
    expect(payload).toHaveProperty('message');
  });

  test('will return 500 with error when an undefined code is requested and there is no default response', async () => {
    const response = await server.fastify.inject({
      method: 'GET',
      url: '/pets/findByStatus?status=available&__code=499',
    });

    expect(response.statusCode).toBe(500);
  });
});

describe('oas2 specific tests', () => {
  test('should return response even if there is no content defined in spec', async () => {
    const server = createServer({}, { components: {}, config: { mock: true } });
    await server.prism.load({
      path: resolve(__dirname, 'fixtures', 'no-responses.oas2.yaml'),
    });

    const response = await server.fastify.inject({ method: 'GET', url: '/' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toEqual('text/plain');
    expect(response.payload).toEqual('');

    await server.fastify.close();
  });
});
