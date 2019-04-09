import { httpLoaderInstance } from '@stoplight/prism-core';
import { createServer as createPrismServer } from '@stoplight/prism-http-server';
import { createServer } from '../createServer';

jest.mock('@stoplight/prism-core');
jest.mock('@stoplight/prism-http-server', () => ({
  createServer: jest.fn(),
}));

describe('server command', () => {
  beforeEach(() => {
    (createPrismServer as jest.Mock).mockClear();
  });

  test('starts filesystem server variant', async () => {
    createServer('/path/to', true);

    expect(createPrismServer).toHaveBeenLastCalledWith(
      { path: '/path/to' },
      { config: { mock: true } }
    );
  });

  test('starts http server variant', async () => {
    createServer('http://path.to/spec.oas2.yaml', false);

    expect(createPrismServer).toHaveBeenLastCalledWith(
      { url: 'http://path.to/spec.oas2.yaml' },
      { components: { loader: httpLoaderInstance }, config: { mock: false } }
    );
  });
});
