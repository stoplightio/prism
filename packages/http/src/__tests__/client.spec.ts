import * as nock from 'nock';
import { createNewClientInstanceFromFile, PrismHttp } from '../client';
import { forwarder } from '../forwarder';
import { mocker } from '../mocker';

type PromiseType<T> = T extends Promise<infer U> ? U : never;

describe('User Http Client', () => {
  afterEach(() => nock.cleanAll());

  describe('with mocking set to false', () => {
    describe('get a resource', () => {
      let response: PromiseType<ReturnType<PrismHttp['get']>>;
      beforeAll(async () => {
        jest.spyOn(forwarder, 'fforward');
        jest.spyOn(mocker, 'mock');

        nock('https://petstore.swagger.io/v2')
          .get('/pet/10')
          .reply(200, {
            license: {
              key: 'mit',
              name: 'MIT License',
              spdx_id: 'MIT',
              url: 'https://api.github.com/licenses/mit',
              node_id: 'MDc6TGljZW5zZTEz',
            },
          });

        const client = await createNewClientInstanceFromFile(
          { mock: false, validateRequest: true, validateResponse: true },
          require.resolve('../../../../examples/petstore.oas2.yaml'),
        );

        response = await client.get('/pet/10');
      });

      test('should not call the mocker', () => expect(mocker.mock).not.toHaveBeenCalled());
      test('should call the forwarder', () => expect(forwarder.fforward).toHaveBeenCalled());
      test('should receive a response', () => expect(response).toBeDefined());
      test('should have output validations errors', () =>
        expect(response.validations.output.length).toBeGreaterThan(0));

      describe('when setting the validateResopnse false on request level', () => {
        test('should not have output validations errors', async () => {
          const client = await createNewClientInstanceFromFile(
            { mock: false, validateRequest: true, validateResponse: true },
            require.resolve('../../../../examples/petstore.oas2.yaml'),
          );

          response = await client.get('/pet/10', {}, { validateResponse: false, mock: false, validateRequest: true });
          expect(response.validations.output).toHaveLength(0);
        });
      });
    });
  });
});
