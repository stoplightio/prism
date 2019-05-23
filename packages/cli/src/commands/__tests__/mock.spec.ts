import { createServer } from '../../util/createServer';
import Mock from '../mock';

const listenMock = jest.fn();

jest.mock('../../util/createServer', () => ({
  createServer: jest.fn(() => ({ listen: listenMock, prism: { resources: [{ method: 'get', path: '/test' }] } })),
}));

describe('mock command', () => {
  beforeEach(() => {
    (createServer as jest.Mock).mockClear();
  });

  test('starts mock server', async () => {
    await Mock.run(['/path/to']);
    expect(createServer).toHaveBeenLastCalledWith('/path/to', { mock: { dynamic: true } });
    expect(listenMock).toHaveBeenLastCalledWith(4010);
  });

  test('starts mock server on custom port', async () => {
    await Mock.run(['-p', '666', '/path/to']);
    expect(createServer).toHaveBeenLastCalledWith('/path/to', { mock: { dynamic: true } });
    expect(listenMock).toHaveBeenLastCalledWith(666);
  });
});
