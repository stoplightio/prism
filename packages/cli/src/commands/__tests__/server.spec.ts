import { createServer } from '../../util/createServer';
import Server from '../server';

const listenMock = jest.fn();

jest.mock('../../util/createServer', () => ({
  createServer: jest.fn(() => ({ listen: listenMock })),
}));

describe('server command', () => {
  beforeEach(() => {
    (createServer as jest.Mock).mockClear();
  });

  test('starts proxy server', async () => {
    await Server.run(['/path/to']);
    expect(createServer).toHaveBeenLastCalledWith('/path/to', false);
    expect(listenMock).toHaveBeenLastCalledWith(4010);
  });

  test('starts proxy server on custom port', async () => {
    await Server.run(['-p', '666', '/path/to']);
    expect(createServer).toHaveBeenLastCalledWith('/path/to', false);
    expect(listenMock).toHaveBeenLastCalledWith(666);
  });
});
