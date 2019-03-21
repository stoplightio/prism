import { relative, resolve } from 'path';
import { createServer } from '../';
import { IPrismHttpServer } from '../types';

describe('server', () => {
  let server: IPrismHttpServer<any>;

  beforeAll(async () => {
    server = createServer({}, {});
    await server.prism.load({
      path: relative(
        process.cwd(),
        resolve(__dirname, '..', '..', '..', 'cli', 'src', 'samples', 'no-refs-petstore.oas2.json')
      ),
    });
  });

  afterAll(() => new Promise(res => server.fastify.close(res)));

  test('should mock back /pet/:petId', async () => {
    const response = await server.fastify.inject({
      method: 'GET',
      url: '/pet/123',
    });

    expect(response.statusCode).toBe(200);
  });

  test('will return requested error response even if no schema or examples defined', async () => {
    const response = await server.fastify.inject({
      method: 'GET',
      url: '/pet/123?__code=404',
    });

    expect(response.statusCode).toBe(404);
    expect(response.raw).toBe('');
  });

  test('will return requested error response when schema is provided', async () => {
    const response = await server.fastify.inject({
      method: 'GET',
      url: '/pet/123?__code=418',
    });

    expect(response.statusCode).toBe(418);
  });

  test('will return 500 with error when an undefined code is requested', async () => {
    const response = await server.fastify.inject({
      method: 'GET',
      url: '/pet/123?__code=499',
    });

    expect(response.statusCode).toBe(500);
  });

  test('should support multiple param values', async () => {
    const response = await server.fastify.inject({
      method: 'GET',
      url: '/pet/findByStatus?status=available&status=sold',
    });

    expect(response.statusCode).toBe(200);
  });

  test('should default to 201 and mock from schema', async () => {
    const response = await server.fastify.inject({
      method: 'GET',
      url: '/user/username',
    });

    expect(Object.keys(JSON.parse(response.payload))).toEqual([
      'id',
      'username',
      'firstName',
      'lastName',
      'email',
      'password',
      'phone',
      'userStatus',
    ]);
    expect(response.statusCode).toBe(201);
  });

  test('should support body params', async () => {
    const response = await server.fastify.inject({
      method: 'POST',
      url: '/store/order',
      payload: {
        id: 1,
        petId: 2,
        quantity: 3,
        shipDate: '12-01-2018',
        status: 'placed',
        complete: true,
      },
    });

    expect(response.statusCode).toBe(200);
  });
});
