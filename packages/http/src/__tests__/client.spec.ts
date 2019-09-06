import * as nock from 'nock';
import createNewClientInstance from '../client';

describe('User Http Client', () => {
  afterEach(() => nock.cleanAll());

  test('something', async () => {
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

    const client = await createNewClientInstance(
      { mock: false, validateRequest: true, validateResponse: true },
      require.resolve('../../../../examples/petstore.oas2.yaml'),
    );

    const result = await client.get('/pet/10', {});

    expect(result).toBeDefined();
  });
});
