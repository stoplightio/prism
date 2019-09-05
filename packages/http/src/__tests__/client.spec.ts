import getHttpOperations from '@stoplight/prism-cli/src/util/getHttpOperations';
import * as pino from 'pino';
import createNewClientInstance from '../client';

const logger = pino();

describe('New Http Client tests', () => {
  test('something', async () => {
    const ops = await getHttpOperations('/Users/vncz/dev/stoplight/prism/examples/petstore.oas2.yaml');

    const client = createNewClientInstance(
      { mock: false, validateRequest: true, validateResponse: true, cors: true },
      logger,
      ops,
    );

    const result = await client.get('/pet/10', {});

    expect(result).toBeDefined();
  });
});
