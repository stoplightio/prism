import { createLogger } from '@stoplight/prism-core';
import { getHttpOperationsFromResource } from '@stoplight/prism-http';
import { resolve } from 'path';
import { createServer } from '../';
import { IPrismHttpServer } from '../types';

const logger = createLogger('TEST', { enabled: false });

function checkErrorPayloadShape(payload: string) {
  const parsedPayload = JSON.parse(payload);

  expect(parsedPayload).toHaveProperty('type');
  expect(parsedPayload).toHaveProperty('title');
  expect(parsedPayload).toHaveProperty('status');
  expect(parsedPayload).toHaveProperty('detail');
}

async function instantiatePrism(specPath: string) {
  const operations = await getHttpOperationsFromResource(specPath);
  const server = createServer(operations, {
    components: { logger },
    config: { checkSecurity: true, validateRequest: true, validateResponse: true, mock: { dynamic: false } },
    cors: true,
  });
  return server;
}

describe('GET /pet?__server', () => {
  let server: IPrismHttpServer;

  beforeAll(async () => {
    server = await instantiatePrism(resolve(__dirname, 'fixtures', 'templated-server-example.oas3.yaml'));
  });

  afterAll(() => server.fastify.close());

  describe.each([['http://stoplight.io/api'], ['https://stoplight.io/api']])('valid server %s', serverUrl => {
    it('returns 200', () => {
      return expect(requestPetGivenServer(serverUrl)).resolves.toMatchObject({
        statusCode: 200,
      });
    });
  });

  describe.each([['https://stoplight.com/api'], ['https://google.com/api'], ['https://stopligt.io/v1']])(
    'invalid server %s',
    serverUrl => {
      it('returns 404 and problem json payload', () => {
        return expect(requestPetGivenServer(serverUrl)).resolves.toMatchObject({
          statusCode: 404,
          payload: expectedPayload(serverUrl),
        });
      });
    },
  );

  const expectedPayload = (serverUrl: string) =>
    `{"type":"https://stoplight.io/prism/errors#NO_SERVER_MATCHED_ERROR","title":"Route not resolved, no server matched","status":404,"detail":"The server url ${serverUrl} hasn\'t been matched with any of the provided servers"}`;

  function requestPetGivenServer(serverUrl: string) {
    return server.fastify.inject({
      method: 'GET',
      url: `/pet?__server=${serverUrl}`,
    });
  }
});

describe.each([['petstore.no-auth.oas2.yaml', 'petstore.no-auth.oas3.yaml']])('server %s', file => {
  let server: IPrismHttpServer;

  beforeAll(async () => {
    server = await instantiatePrism(resolve(__dirname, 'fixtures', file));
  });

  afterAll(() => server.fastify.close());

  it('should mock back /pets/:petId', async () => {
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

  it('should not mock a verb that is not defined on a path', async () => {
    const response = await server.fastify.inject({
      method: 'PATCH',
      url: '/pets/123',
    });
    expect(response.statusCode).toBe(405);
    checkErrorPayloadShape(response.payload);
  });

  it('will return requested response using the __code property', async () => {
    const response = await server.fastify.inject({
      method: 'GET',
      url: '/pets/123?__code=404',
    });

    expect(response.statusCode).toBe(404);
    expect(response.payload).toBe('');
  });

  it('will return requested error response with payload', async () => {
    const response = await server.fastify.inject({
      method: 'GET',
      url: '/pets/123?__code=418',
    });

    expect(response.statusCode).toBe(418);

    const payload = JSON.parse(response.payload);
    expect(payload).toHaveProperty('name');
  });

  it('returns 404 with error when a non-existent example is requested', async () => {
    const response = await server.fastify.inject({
      method: 'GET',
      url: '/pets/123?__example=non_existent_example',
    });

    expect(response.statusCode).toBe(404);
    checkErrorPayloadShape(response.payload);
  });

  it('should not mock a request that is missing the required query parameters with no default', async () => {
    const response = await server.fastify.inject({
      method: 'GET',
      url: '/pets/findByTags',
    });

    expect(response.statusCode).toBe(400);
  });

  test.todo(
    'should automagically provide the parameters when not provided in the query string and a default is defined',
  );

  it('should support multiple param values', async () => {
    const response = await server.fastify.inject({
      method: 'GET',
      url: '/pets/findByStatus?status=available&status=sold',
    });

    expect(response.statusCode).toBe(200);
  });

  it('should default to 200 and mock from schema', async () => {
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

  it('will return the default response when using the __code property with a non existing code', async () => {
    const response = await server.fastify.inject({
      method: 'GET',
      url: '/pets/123?__code=499',
    });

    expect(response.statusCode).toBe(499);
  });

  it('will return 500 with error when an undefined code is requested and there is no default response', async () => {
    const response = await server.fastify.inject({
      method: 'GET',
      url: '/pets/findByStatus?status=available&__code=499',
    });

    expect(response.statusCode).toBe(404);
    checkErrorPayloadShape(response.payload);
  });

  it('should mock the response headers', async () => {
    const response = await server.fastify.inject({
      method: 'GET',
      url: '/user/login?username=foo&password=foo',
    });

    // OAS2 does not support examples for Headers, to they MUST be always generated automagically,
    // accorging to the schema

    const expectedValues = {
      'x-rate-limit': file === 'petstore.oas3.yaml' ? 1000 : expect.any(Number),
      'x-stats': file === 'petstore.oas3.yaml' ? 1500 : expect.any(Number),
      'x-expires-after': expect.any(String),
      'x-strange-header': null,
    };

    for (const headerName of Object.keys(expectedValues)) {
      expect(response.headers).toHaveProperty(headerName, expectedValues[headerName]);
    }
  });

  describe('server validation: given __server query param', () => {
    it('when the server is not valid then return error', async () => {
      const response = await server.fastify.inject({
        method: 'GET',
        url: '/pets/10?__server=https://google.com',
      });

      expect(response.statusCode).toBe(404);
      const parsed = JSON.parse(response.payload);

      expect(parsed).toHaveProperty('type', 'https://stoplight.io/prism/errors#NO_SERVER_MATCHED_ERROR');
      expect(parsed).toHaveProperty(
        'detail',
        "The server url https://google.com hasn't been matched with any of the provided servers",
      );
    });

    it('when the server is valid then return 200', async () => {
      const response = await server.fastify.inject({
        method: 'GET',
        url: '/pets/10?__server=https://petstore.swagger.io/v2',
      });

      expect(response.statusCode).toBe(200);
    });

    // oas2 does not support overriding servers and named examples
    if (file === 'petstore.oas3.json') {
      it('returns requested response example using __example property', async () => {
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

      describe('and operation overrides global servers', () => {
        it(`when the server is valid then return 200`, async () => {
          const response = await server.fastify.inject({
            method: 'GET',
            url: '/store/inventory?__server=https://petstore.swagger.io/v3',
          });

          expect(response.statusCode).toBe(200);
        });

        it(`when the server is not valid for this exact operation then return error`, async () => {
          const response = await server.fastify.inject({
            method: 'GET',
            url: '/store/inventory?__server=https://petstore.swagger.io/v2',
          });

          expect(response.statusCode).toBe(404);
          expect(response.payload).toEqual(
            '{"type":"https://stoplight.io/prism/errors#NO_SERVER_MATCHED_ERROR","title":"Route not resolved, no server matched","status":404,"detail":"The server url https://petstore.swagger.io/v2 hasn\'t been matched with any of the provided servers"}',
          );
        });

        it(`when the server is invalid return error`, async () => {
          const response = await server.fastify.inject({
            method: 'GET',
            url: '/store/inventory?__server=https://notvalid.com',
          });

          expect(response.statusCode).toBe(404);
          expect(response.payload).toEqual(
            '{"type":"https://stoplight.io/prism/errors#NO_SERVER_MATCHED_ERROR","title":"Route not resolved, no server matched","status":404,"detail":"The server url https://notvalid.com hasn\'t been matched with any of the provided servers"}',
          );
        });
      });
    }
  });

  describe('content negotiation', () => {
    it('returns a valid response when multiple choices are given', async () => {
      const response = await server.fastify.inject({
        method: 'GET',
        url: '/pets/10',
        headers: {
          accept: 'idonotexist/something,application/json',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers).toHaveProperty('content-type', 'application/json');
    });

    it('respects the priority when multiple available choices match', async () => {
      const response = await server.fastify.inject({
        method: 'GET',
        url: '/pets/10',
        headers: {
          accept: 'application/json,application/xml',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers).toHaveProperty('content-type', 'application/json');
    });

    it('returns 406 response when the requested media type is not offered', async () => {
      const response = await server.fastify.inject({
        method: 'GET',
        url: '/pets/10',
        headers: {
          accept: 'idonotexist/something',
        },
      });

      expect(response.statusCode).toBe(406);
    });

    it('fallbacks to application/json in case the Accept header is not provided', async () => {
      const response = await server.fastify.inject({
        method: 'GET',
        url: '/store/inventory',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers).toHaveProperty('content-type', 'application/json');
    });

    it('returns application/json even if the resources have the charset parameter', async () => {
      const response = await server.fastify.inject({
        method: 'GET',
        url: '/user/user1',
        headers: {
          accept: 'application/json',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers).toHaveProperty('content-type', 'application/json; charset=utf-8');
    });
  });
});
