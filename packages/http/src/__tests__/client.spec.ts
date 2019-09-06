import createNewClientInstance from '../client';

describe('New Http Client tests', () => {
  test('something', async () => {
    const client = await createNewClientInstance(
      { mock: false, validateRequest: true, validateResponse: true },
      require.resolve('../../../../examples/petstore.oas2.yaml'),
    );

    const result = await client.get('/pet/10', {});

    expect(result).toBeDefined();
  });
});
