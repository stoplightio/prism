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
        checkSecurity: true,
      };

      beforeAll(async () => {
        jest.spyOn(mock, 'default');

        client = await createClientFromOperations(
          [
            {
              id: 'operation',
              method: 'get',
              path: '/pet',
              servers: [
                {
                  url: 'https://www.google.it',
                },
              ],
              responses: [
                {
                  code: '200',
                },
              ],
            },
          ],
          config,
        );

        jest.spyOn(client, 'request');
      });

      afterAll(() => jest.clearAllMocks());

      describe('when calling with no options', () => {
        beforeAll(() => client.get('/pet'));

        test('shall call the mocker with the default options', () =>
          expect(mock.default).toHaveBeenCalledWith({ input: expect.anything(), resource: expect.anything(), config }));

        test('shall ultimately call the main request method with the current HTTP Method', () =>
          expect(client.request).toHaveBeenCalledWith('/pet', { method: 'get' }, undefined));
      });

      describe('when overriding a config parameter on the request level', () => {
        beforeAll(() => client.get('/pet', { checkSecurity: false }));

        test('shall call the mocker with the modified options', () =>
          expect(mock.default).toHaveBeenCalledWith({
            input: expect.anything(),
            resource: expect.anything(),
            config: { ...config, checkSecurity: false },
          }));
      });

      describe('when calling a method with overridden url', () => {
        beforeAll(() => client.get('/pet', { baseUrl: 'https://www.google.it' }));

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
