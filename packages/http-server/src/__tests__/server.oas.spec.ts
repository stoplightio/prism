import { relative, resolve } from 'path';
import { createServer } from '../';
import { IPrismHttpServer } from '../types';

function checkErrorPayloadShape(payload: string) {
  const parsedPayload = JSON.parse(payload);

  expect(parsedPayload).toHaveProperty('type');
  expect(parsedPayload).toHaveProperty('title');
  expect(parsedPayload).toHaveProperty('status');
  expect(parsedPayload).toHaveProperty('detail');
}

describe.each([['petstore.oas2.json'], ['petstore.oas3.json']])('server %s', file => {
  let server: IPrismHttpServer<{}>;

  beforeAll(async () => {
    server = createServer({}, { components: {}, config: { mock: { dynamic: false } } });
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
    checkErrorPayloadShape(response.payload);
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

  test('returns requested response example using __example property', async () => {
    const response = await server.fastify.inject({
      method: 'GET',
      url: '/pets/123?__example=cat',
    });

    const payload = JSON.parse(response.payload);

    expect(response.statusCode).toBe(200);
    expect(payload).toStrictEqual({
      id: 2,
      category: {
        id: 1,
        name: 'Felis',
      },
      tags: [
        {
          id: 1,
          name: 'pet',
        },
      ],
      name: 'Fluffy',
      status: 'available',
      photoUrls: [],
    });
  });

  test('returns 500 with error when a non-existent example is requested', async () => {
    const response = await server.fastify.inject({
      method: 'GET',
      url: '/pets/123?__example=non_existent_example',
    });

    expect(response.statusCode).toBe(500);
    checkErrorPayloadShape(response.payload);
  });

  test('should not mock a request that is missing the required query parameters with no default', async () => {
    const response = await server.fastify.inject({
      method: 'GET',
      url: '/pets/findByTags',
    });

    expect(response.statusCode).toBe(422);
    checkErrorPayloadShape(response.payload);
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
    expect(response.statusCode).toBe(422);
    checkErrorPayloadShape(response.payload);
  });

  test('will return the default response when using the __code property with a non existing code', async () => {
    const response = await server.fastify.inject({
      method: 'GET',
      url: '/pets/123?__code=499',
    });

    expect(response.statusCode).toBe(499);
  });

  test('will return 500 with error when an undefined code is requested and there is no default response', async () => {
    const response = await server.fastify.inject({
      method: 'GET',
      url: '/pets/findByStatus?status=available&__code=499',
    });

    expect(response.statusCode).toBe(500);
    checkErrorPayloadShape(response.payload);
  });

  test('should mock the response headers', async () => {
    const response = await server.fastify.inject({
      method: 'GET',
      url: '/user/login?username=foo&password=foo',
    });

    // OAS2 does not support examples for Headers, to they MUST be always generated automagically,
    // accorging to the schema

    const expectedValues = {
      'x-rate-limit': file === 'petstore.oas3.json' ? 1000 : expect.any(String),
      'x-stats': file === 'petstore.oas3.json' ? 1500 : expect.any(String),
      'x-expires-after': expect.any(String),
      'x-strange-header': file === 'petstore.oas3.json' ? 'string' : '{}',
    };

    for (const headerName of Object.keys(expectedValues)) {
      expect(response.headers).toHaveProperty(headerName, expectedValues[headerName]);
    }
  });
});

describe('oas2 specific tests', () => {
  test('should return response even if there is no content defined in spec', async () => {
    const server = createServer({}, { components: {}, config: { mock: { dynamic: false } } });
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
