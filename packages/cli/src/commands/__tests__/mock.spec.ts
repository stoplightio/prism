import { createMultiProcessPrism, createSingleProcessPrism } from '../../util/createServer';
import Mock from '../mock';
jest.mock('../../util/createServer');

describe('mock command', () => {
  beforeEach(() => {
    (createSingleProcessPrism as jest.Mock).mockClear();
    (createMultiProcessPrism as jest.Mock).mockClear();
  });
  test('starts mock server', async () => {
    await Mock.run(['/path/to']);
    expect(createMultiProcessPrism).not.toHaveBeenCalled();
    expect(createSingleProcessPrism).toHaveBeenLastCalledWith({
      spec: '/path/to',
      dynamic: false,
      host: '127.0.0.1',
      port: 4010,
    });
  });

  test('starts mock server on custom port', async () => {
    await Mock.run(['-p', '666', '/path/to']);
    expect(createMultiProcessPrism).not.toHaveBeenCalled();
    expect(createSingleProcessPrism).toHaveBeenLastCalledWith({
      spec: '/path/to',
      dynamic: false,
      host: '127.0.0.1',
      port: 666,
    });
  });

  test('starts mock server on custom host', async () => {
    await Mock.run(['-h', '0.0.0.0', '/path/to']);
    expect(createMultiProcessPrism).not.toHaveBeenCalled();
    expect(createSingleProcessPrism).toHaveBeenLastCalledWith({
      spec: '/path/to',
      dynamic: false,
      host: '0.0.0.0',
      port: 4010,
    });
  });

  test('starts mock server on custom host and port', async () => {
    await Mock.run(['-p', '666', '-h', '0.0.0.0', '/path/to']);
    expect(createMultiProcessPrism).not.toHaveBeenCalled();
    expect(createSingleProcessPrism).toHaveBeenLastCalledWith({
      spec: '/path/to',
      dynamic: false,
      host: '0.0.0.0',
      port: 666,
    });
  });

  test('starts mock server with multiprocess option ', async () => {
    await Mock.run(['-p', '666', '-m', '-h', '0.0.0.0', '/path/to']);
    expect(createSingleProcessPrism).not.toHaveBeenCalled();
    expect(createMultiProcessPrism).toHaveBeenLastCalledWith({
      spec: '/path/to',
      dynamic: false,
      host: '0.0.0.0',
      port: 666,
    });
  });
});
