import { httpLoaderInstance } from '@stoplight/prism-core';
import { createServer } from '@stoplight/prism-http-server';
import Serve from '../serve';

const listenMock = jest.fn();

jest.mock('@stoplight/prism-core');
jest.mock('@stoplight/prism-http-server', () => ({
  createServer: jest.fn(() => ({ listen: listenMock })),
}));

describe('serve command', () => {
  beforeEach(() => {
    (createServer as jest.Mock).mockClear();
  });

  test('starts filesystem server variant', async () => {
    await Serve.run(['-s', '/path/to']);

    expect(createServer).toHaveBeenLastCalledWith({ path: '/path/to' }, { config: { mock: true } });

    expect(listenMock).toHaveBeenLastCalledWith(4010);
  });

  test('starts http server variant', async () => {
    await Serve.run(['-s', 'http://path.to/spec.oas2.yaml']);

    expect(createServer).toHaveBeenLastCalledWith(
      { url: 'http://path.to/spec.oas2.yaml' },
      { components: { loader: httpLoaderInstance }, config: { mock: true } }
    );

    expect(listenMock).toHaveBeenLastCalledWith(4010);
  });
});
