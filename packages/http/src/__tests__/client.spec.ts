import getHttpOperations from '@stoplight/prism-cli/src/util/getHttpOperations';
import createNewClientInstance from '../client';

describe('New Http Client tests', () => {
  test('something', async () => {
    const ops = await getHttpOperations(require.resolve('../../../../examples/petstore.oas2.yaml'));

    const client = createNewClientInstance({ mock: false, validateRequest: true, validateResponse: true }, ops);

    const result = await client.get('/pet/10', {});

    expect(result).toBeDefined();
  });
});
