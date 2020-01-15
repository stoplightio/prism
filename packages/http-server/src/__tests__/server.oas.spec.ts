import { createLogger } from '@stoplight/prism-core';
import { getHttpOperationsFromResource } from '@stoplight/prism-http';
import { resolve } from 'path';
import fetch, { RequestInit } from 'node-fetch';
import { createServer } from '../';
import { ThenArg } from '../types';

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
    config: {
      checkSecurity: true,
      validateRequest: true,
      validateResponse: true,
      errors: false,
      mock: { dynamic: false },
    },
    errors: false,
    cors: true,
  });

  // be careful with selecting the port: it can't be the same in different suite because test suites run in parallel
  const address = await server.listen(30001, '127.0.0.1');

  return {
    close: server.close.bind(server),
    address,
  };
}

describe('GET /pet?__server', () => {
  let server: ThenArg<ReturnType<typeof instantiatePrism>>;

  beforeEach(async () => {
    server = await instantiatePrism(resolve(__dirname, 'fixtures', 'templated-server-example.oas3.yaml'));
  });

  afterEach(() => server.close());

  describe.each([['http://stoplight.io/api'], ['https://stoplight.io/api']])('valid server %s', serverUrl => {
    it('returns 200', () => {
      return expect(requestPetGivenServer(serverUrl)).resolves.toMatchObject({
        status: 200,
      });
    });
  });

  describe.each([['https://stoplight.com/api'], ['https://google.com/api'], ['https://stopligt.io/v1']])(
    'invalid server %s',
    serverUrl => {
      it('returns 404 and problem json payload', async () => {
        const response = await requestPetGivenServer(serverUrl);
        expect(response).toMatchObject({ status: 404 });
        return expect(response.text()).resolves.toEqual(expectedPayload(serverUrl));
      });
    }
  );

  const expectedPayload = (serverUrl: string) =>
    `{"type":"https://stoplight.io/prism/errors#NO_SERVER_MATCHED_ERROR","title":"Route not resolved, no server matched","status":404,"detail":"The server url ${serverUrl} hasn't been matched with any of the provided servers"}`;

  function requestPetGivenServer(serverUrl: string) {
    return fetch(new URL(`/pet?__server=${serverUrl}`, server.address), { method: 'GET' });
  }
});

describe.each([['petstore.no-auth.oas2.yaml', 'petstore.no-auth.oas3.yaml']])('server %s', file => {
  let server: ThenArg<ReturnType<typeof instantiatePrism>>;

  beforeEach(async () => {
    server = await instantiatePrism(resolve(__dirname, 'fixtures', file));
  });

  afterEach(() => server.close());

  function makeRequest(url: string, init?: RequestInit) {
    return fetch(new URL(url, server.address), init);
  }

  it('should mock back /pets/:petId', async () => {
    const response = await makeRequest('/pets/123');

    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload).toHaveProperty('id');
    expect(payload).toHaveProperty('category');
    expect(payload).toHaveProperty('name');
    expect(payload).toHaveProperty('photoUrls');
    expect(payload).toHaveProperty('tags');
    expect(payload).toHaveProperty('status');
  });

  it('should not mock a verb that is not defined on a path', async () => {
    const response = await makeRequest('/pets/123', { method: 'PATCH' });
    expect(response.status).toBe(405);
    checkErrorPayloadShape(await response.text());
  });

  it('will return requested response using the __code property', async () => {
    const response = await makeRequest('/pets/123?__code=404');

    expect(response.status).toBe(404);
    expect(response.text()).resolves.toBe('');
  });

  it('will return requested error response with payload', async () => {
    const response = await makeRequest('/pets/123?__code=418');

    expect(response.status).toBe(418);

    const payload = await response.json();
    expect(payload).toHaveProperty('name');
  });

  it('returns 404 with error when a non-existent example is requested', async () => {
    const response = await makeRequest('/pets/123?__example=non_existent_example');

    expect(response.status).toBe(404);
    checkErrorPayloadShape(await response.text());
  });

  it('should not mock a request that is missing the required query parameters with no default', async () => {
    const response = await makeRequest('/pets/findByTags');
    expect(response.status).toBe(400);
  });

  it('should support multiple param values', async () => {
    const response = await makeRequest('/pets/findByStatus?status=available&status=sold');
    expect(response.status).toBe(200);
  });

  it('should default to 200 and mock from schema', async () => {
    const response = await makeRequest('/user/username');

    expect(response.status).toBe(200);
    const payload = await response.json();
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
    const response = await makeRequest('/pets/123?__code=499');
    expect(response.status).toBe(499);
  });

  it('will return 500 with error when an undefined code is requested and there is no default response', async () => {
    const response = await makeRequest('/pets/findByStatus?status=available&__code=499');

    expect(response.status).toBe(404);
    checkErrorPayloadShape(await response.text());
  });

  it('should mock the response headers', async () => {
    const response = await makeRequest('/user/login?username=foo&password=foo');

    // OAS2 does not support examples for Headers, to they MUST be always generated automagically,
    // according to the schema

    const expectedValues = {
      'x-rate-limit': file === 'petstore.oas3.yaml' ? 1000 : expect.stringMatching(/^\d+$/),
      'x-stats': file === 'petstore.oas3.yaml' ? 1500 : expect.stringMatching(/^\d+$/),
      'x-expires-after': expect.any(String),
      'x-strange-header': 'null',
    };

    for (const headerName of Object.keys(expectedValues)) {
      expect(response.headers.get(headerName)).toEqual(expectedValues[headerName]);
    }
  });

  describe('server validation: given __server query param', () => {
    it('when the server is not valid then return error', async () => {
      const response = await makeRequest('/pets/10?__server=https://google.com');

      expect(response.status).toBe(404);
      const parsed = await response.json();

      expect(parsed).toHaveProperty('type', 'https://stoplight.io/prism/errors#NO_SERVER_MATCHED_ERROR');
      expect(parsed).toHaveProperty(
        'detail',
        "The server url https://google.com hasn't been matched with any of the provided servers"
      );
    });

    it('when the server is valid then return 200', async () => {
      const response = await makeRequest('/pets/10?__server=https://petstore.swagger.io/v2');
      expect(response.status).toBe(200);
    });

    // oas2 does not support overriding servers and named examples
    if (file === 'petstore.oas3.json') {
      it('returns requested response example using __example property', async () => {
        const response = await makeRequest('/pets/123?__example=cat');
        const payload = await response.json();

        expect(response.status).toBe(200);
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
          const response = await makeRequest('/store/inventory?__server=https://petstore.swagger.io/v3');
          expect(response.status).toBe(200);
        });

        it(`when the server is not valid for this exact operation then return error`, async () => {
          const response = await makeRequest('/store/inventory?__server=https://petstore.swagger.io/v2');
          expect(response.status).toBe(404);
          expect(response.text()).resolves.toEqual(
            '{"type":"https://stoplight.io/prism/errors#NO_SERVER_MATCHED_ERROR","title":"Route not resolved, no server matched","status":404,"detail":"The server url https://petstore.swagger.io/v2 hasn\'t been matched with any of the provided servers"}'
          );
        });

        it(`when the server is invalid return error`, async () => {
          const response = await makeRequest('/store/inventory?__server=https://notvalid.com');
          expect(response.status).toBe(404);
          expect(response.text()).resolves.toEqual(
            '{"type":"https://stoplight.io/prism/errors#NO_SERVER_MATCHED_ERROR","title":"Route not resolved, no server matched","status":404,"detail":"The server url https://notvalid.com hasn\'t been matched with any of the provided servers"}'
          );
        });
      });
    }
  });

  describe('content negotiation', () => {
    it('returns a valid response when multiple choices are given', async () => {
      const response = await makeRequest('/pets/10', {
        headers: {
          accept: 'idonotexist/something,application/json',
        },
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toEqual('application/json');
    });

    it('respects the priority when multiple available choices match', async () => {
      const response = await makeRequest('/pets/10', {
        headers: {
          accept: 'application/json,application/xml',
        },
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toEqual('application/json');
    });

    it('returns 406 response when the requested media type is not offered', async () => {
      const response = await makeRequest('/pets/10', {
        headers: {
          accept: 'idonotexist/something',
        },
      });

      expect(response.status).toBe(406);
    });

    it('fallbacks to application/json in case the Accept header is not provided', async () => {
      const response = await makeRequest('/store/inventory', { headers: { accept: '' } });
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toEqual('application/json');
    });

    it('returns application/json even if the resources have the charset parameter', async () => {
      const response = await makeRequest('/user/user1', {
        headers: {
          accept: 'application/json',
        },
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toEqual('application/json; charset=utf-8');
    });
  });
});
