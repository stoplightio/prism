import { createClientFromResource, PrismHttp } from '../client';
import { mocker } from '../mocker';

type PromiseType<T> = T extends Promise<infer U> ? U : never;

describe('User Http Client', () => {
  describe('with mocking set to true', () => {
    describe('get a resource', () => {
      let response: PromiseType<ReturnType<PrismHttp['get']>>;
      beforeAll(async () => {
        jest.spyOn(mocker, 'mock');

        const client = await createClientFromResource(require.resolve('../../../../examples/petstore.oas2.yaml'), {
          mock: { dynamic: false },
          validateRequest: true,
          validateResponse: true,
          validateSecurity: true,
        });

        response = await client.get('/pet/10');
      });

      test('should not call the mocker', () => expect(mocker.mock).toHaveBeenCalled());
      test('should receive a response', () => expect(response).toBeDefined());
      test('should have output validations errors', () =>
        expect(response.validations.output.length).toBeGreaterThan(0));

      describe('when setting the validateResponse false on request level', () => {
        test('should not have output validations errors', async () => {
          const client = await createClientFromResource(require.resolve('../../../../examples/petstore.oas2.yaml'), {
            mock: { dynamic: false },
            validateRequest: true,
            validateResponse: true,
            validateSecurity: true,
          });

          response = await client.get('/pet/10', {
            validateResponse: false,
            mock: { dynamic: false },
            validateRequest: true,
            validateSecurity: true,
          });
          expect(response.validations.output).toHaveLength(0);
        });
      });
    });
  });
});
