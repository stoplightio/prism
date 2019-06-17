import { createLogger } from '@stoplight/prism-core';
import { relative, resolve } from 'path';
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
  const server = createServer({}, { components: { logger }, config: { mock: { dynamic: false } } });
  await server.prism.load({
    path: relative(process.cwd(), specPath),
  });
  return server;
}

describe('GET /pet?__server', () => {
  let server: IPrismHttpServer<{}>;

  beforeAll(async () => {
    server = await instantiatePrism(resolve(__dirname, 'fixtures', 'templated-server-example.oas3.json'));
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
    `{"type":"https://stoplight.io/prism/errors#NO_SERVER_MATCHED_ERROR","title":"Route not resolved, no server matched.","status":404,"detail":"The server url ${serverUrl} hasn\'t been matched with any of the provided servers"}`;

  function requestPetGivenServer(serverUrl: string) {
    return server.fastify.inject({
      method: 'GET',
      url: `/pet?__server=${serverUrl}`,
    });
  }
});

describe('GET /pet with invalid body', () => {
  it('returns correct error message', async () => {
    const server = await instantiatePrism(resolve(__dirname, 'fixtures', 'getOperationWithBody.oas2.json'));

    const response = await server.fastify.inject({
      method: 'GET',
      url: '/pet',
      payload: {
        id: 'strings are not valid!',
      },
    });

    expect(response.statusCode).toBe(422);
    expect(response.payload).toEqual(
      '{"type":"https://stoplight.io/prism/errors#UNPROCESSABLE_ENTITY","title":"Invalid request body payload","status":422,"detail":"Your request body is not valid: [{\\"path\\":[\\"body\\"],\\"code\\":\\"type\\",\\"message\\":\\"should be object\\",\\"severity\\":0}]"}',
    );
    await server.fastify.close();
  });
});

describe.each([['petstore.oas2.json'], ['petstore.oas3.json']])('server %s', file => {
  let server: IPrismHttpServer<{}>;

  beforeAll(async () => {
    server = await instantiatePrism(resolve(__dirname, '..', '..', '..', '..', 'examples', file));
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
      method: 'POST',
      url: '/pets/123',
    });
    expect(response.statusCode).toBe(500);
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

  it('returns 500 with error when a non-existent example is requested', async () => {
    const response = await server.fastify.inject({
      method: 'GET',
      url: '/pets/123?__example=non_existent_example',
    });

    expect(response.statusCode).toBe(500);
    checkErrorPayloadShape(response.payload);
  });

  it('should not mock a request that is missing the required query parameters with no default', async () => {
    const response = await server.fastify.inject({
      method: 'GET',
      url: '/pets/findByTags',
    });

    expect(response.statusCode).toBe(422);
    checkErrorPayloadShape(response.payload);
  });

  it.skip('should automagically provide the parameters when not provided in the query string and a default is defined', async () => {
    const response = await server.fastify.inject({
      method: 'GET',
      url: '/pets/findByStatus',
    });

    expect(response.statusCode).toBe(200);
  });

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

  it('should validate body params', async () => {
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

  it('should validate the body params and return an error code', async () => {
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

    expect(response.statusCode).toBe(500);
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
      'x-rate-limit': file === 'petstore.oas3.json' ? 1000 : expect.any(Number),
      'x-stats': file === 'petstore.oas3.json' ? 1500 : expect.any(Number),
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
      expect(response.payload).toEqual(
        '{"type":"https://stoplight.io/prism/errors#NO_SERVER_MATCHED_ERROR","title":"Route not resolved, no server matched.","status":404,"detail":"The server url https://google.com hasn\'t been matched with any of the provided servers"}',
      );
    });

    it('when the server is valid then return 200', async () => {
      const response = await server.fastify.inject({
        method: 'GET',
        url: '/pets/10?__server=https://petstore.swagger.io/v2',
      });

      expect(response.statusCode).toBe(200);
    });

    // oas2 does not support overriding servers
    if (file === 'petstore.oas3.json') {
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
            '{"type":"https://stoplight.io/prism/errors#NO_SERVER_MATCHED_ERROR","title":"Route not resolved, no server matched.","status":404,"detail":"The server url https://petstore.swagger.io/v2 hasn\'t been matched with any of the provided servers"}',
          );
        });

        it(`when the server is invalid return error`, async () => {
          const response = await server.fastify.inject({
            method: 'GET',
            url: '/store/inventory?__server=https://notvalid.com',
          });

          expect(response.statusCode).toBe(404);
          expect(response.payload).toEqual(
            '{"type":"https://stoplight.io/prism/errors#NO_SERVER_MATCHED_ERROR","title":"Route not resolved, no server matched.","status":404,"detail":"The server url https://notvalid.com hasn\'t been matched with any of the provided servers"}',
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
      expect(response.headers).toHaveProperty('content-type', 'application/json; charset=utf-8');
    });

    it('respects the priority when multiple avaiable choices match', async () => {
      const response = await server.fastify.inject({
        method: 'GET',
        url: '/pets/10',
        headers: {
          accept: 'application/json,application/xml',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers).toHaveProperty('content-type', 'application/json; charset=utf-8');
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
      expect(response.headers).toHaveProperty('content-type', 'application/json; charset=utf-8');
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
