import { createClientFromOperations } from '../client';
import { mocker } from '../mocker';
import { IHttpConfig } from '../types';

describe('User Http Client', () => {
  describe('with mocking set to true', () => {
    describe('get a resource', () => {
      let client: ReturnType<typeof createClientFromOperations>;

      const config: IHttpConfig = {
        mock: { dynamic: false },
        validateRequest: true,
        validateResponse: true,
        validateSecurity: true,
      };

      beforeAll(async () => {
        client = await createClientFromOperations(
          [
            {
              id: 'operation',
              method: 'get',
              path: '/pet',
              responses: [
                {
                  code: '200',
                },
              ],
            },
          ],
          config,
        );

        jest.spyOn(mocker, 'mock');
        jest.spyOn(client, 'request');
      });

      afterAll(() => jest.clearAllMocks());

      describe('when calling with no options', () => {
        beforeAll(() => client.get('/pet'));

        test('shall call the mocker with the default options', () =>
          expect(mocker.mock).toHaveBeenCalledWith({ input: expect.anything(), resource: expect.anything(), config }));

        test('shall ultimately call the main request method', () => {
          expect(client.request).toHaveBeenCalled();
        });
      });

      describe('when overriding a config parameter on the request level', () => {
        beforeAll(() => client.get('/pet', { validateSecurity: false }));

        test('shall call the mocker with the modified options', () => {
          expect(mocker.mock).toHaveBeenCalledWith({
            input: expect.anything(),
            resource: expect.anything(),
            config: { ...config, validateSecurity: false },
          });
        });
      });
    });
  });
});
