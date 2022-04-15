import { createClientFromOperations } from '../client';
import * as mock from '../mocker';
import { IHttpConfig } from '../types';

describe('User Http Client', () => {
  describe('with mocking set to true', () => {
    describe('get a resource', () => {
      let client: ReturnType<typeof createClientFromOperations>;

      const config: IHttpConfig = {
        mock: { dynamic: false },
        validateRequest: true,
        validateResponse: true,
        errors: false,
        checkSecurity: true,
        upstreamProxy: undefined,
      };

      beforeAll(() => {
        jest.spyOn(mock, 'default');

        client = createClientFromOperations(
          [
            {
              id: 'operation',
              method: 'get',
              path: '/pet',
              servers: [
                {
                  id: 'server-1',
                  url: 'https://www.google.it',
                },
              ],
              responses: [
                {
                  id: 'response-1',
                  code: '200',
                },
              ],
            },
          ],
          config
        );

        jest.spyOn(client, 'request');
      });

      describe('when calling with no options', () => {
        beforeAll(() => client.get('/pet'));

        afterAll(() => jest.clearAllMocks());

        test('shall call the mocker with the default options', () =>
          expect(mock.default).toHaveBeenCalledWith({
            input: expect.anything(),
            resource: expect.anything(),
            config: config.mock,
          }));

        test('shall ultimately call the main request method with the current HTTP Method', () =>
          expect(client.request).toHaveBeenCalledWith('/pet', { method: 'get' }, undefined));
      });

      describe('when calling a method with overridden url', () => {
        beforeAll(() => client.get('/pet', { baseUrl: 'https://www.google.it' }));

        afterAll(() => jest.clearAllMocks());

        test('should call the mocker with the replaced full url', () => {
          expect(mock.default).toBeCalledWith({
            resource: expect.anything(),
            input: expect.objectContaining({
              data: expect.objectContaining({
                url: expect.objectContaining({
                  baseUrl: 'https://www.google.it',
                  path: '/pet',
                }),
              }),
            }),
            config: expect.anything(),
          });
        });
      });

      describe('when calling a method with a full url', () => {
        beforeAll(() => client.get('https://www.google.it/pet'));

        afterAll(() => jest.clearAllMocks());

        test('should call the mocker with the replaced full url', () => {
          expect(mock.default).toBeCalledWith({
            resource: expect.anything(),
            input: expect.objectContaining({
              data: expect.objectContaining({
                url: expect.objectContaining({
                  baseUrl: 'https://www.google.it',
                  path: '/pet',
                }),
              }),
            }),
            config: expect.anything(),
          });
        });
      });
    });
  });
});
