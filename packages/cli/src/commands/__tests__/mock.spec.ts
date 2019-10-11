import * as utils from '@stoplight/prism-http';
import * as yargs from 'yargs';
import { createMultiProcessPrism, createSingleProcessPrism } from '../../util/createServer';
import mockCommand from '../mock';

const parser = yargs.command(mockCommand);

jest.mock('../../util/createServer', () => ({
  createMultiProcessPrism: jest.fn().mockResolvedValue([]),
  createSingleProcessPrism: jest.fn().mockResolvedValue([]),
}));

jest.spyOn(utils, 'getHttpOperationsFromResource').mockResolvedValue([]);

describe('mock command', () => {
  beforeEach(() => {
    (createSingleProcessPrism as jest.Mock).mockClear();
    (createMultiProcessPrism as jest.Mock).mockClear();
  });

  test('starts mock server', async () => {
    await new Promise(resolve => {
      parser.parse('mock /path/to', (_err: Error, commandPromise: Promise<unknown>) => commandPromise.then(resolve));
    });

    expect(createMultiProcessPrism).not.toHaveBeenCalled();
    expect(createSingleProcessPrism).toHaveBeenLastCalledWith({
      operations: [],
      dynamic: false,
      cors: true,
      host: '127.0.0.1',
      port: 4010,
    });
  });

  test('starts mock server on custom port', async () => {
    await new Promise(resolve => {
      parser.parse('mock /path/to -p 666', (_err: Error, commandPromise: Promise<unknown>) =>
        commandPromise.then(resolve),
      );
    });

    expect(createMultiProcessPrism).not.toHaveBeenCalled();
    expect(createSingleProcessPrism).toHaveBeenLastCalledWith({
      operations: [],
      dynamic: false,
      cors: true,
      host: '127.0.0.1',
      port: 666,
    });
  });

  test('starts mock server on custom host', async () => {
    await new Promise(resolve => {
      parser.parse('mock /path/to -h 0.0.0.0', (_err: Error, commandPromise: Promise<unknown>) =>
        commandPromise.then(resolve),
      );
    });

    expect(createMultiProcessPrism).not.toHaveBeenCalled();
    expect(createSingleProcessPrism).toHaveBeenLastCalledWith({
      operations: [],
      dynamic: false,
      cors: true,
      host: '0.0.0.0',
      port: 4010,
    });
  });

  test('starts mock server on custom host and port', async () => {
    await new Promise(resolve => {
      parser.parse('mock /path/to -p 666 -h 0.0.0.0', (_err: Error, commandPromise: Promise<unknown>) =>
        commandPromise.then(resolve),
      );
    });

    expect(createMultiProcessPrism).not.toHaveBeenCalled();
    expect(createSingleProcessPrism).toHaveBeenLastCalledWith({
      operations: [],
      cors: true,
      dynamic: false,
      host: '0.0.0.0',
      port: 666,
    });
  });

  test('starts mock server with multiprocess option ', async () => {
    await new Promise(resolve => {
      parser.parse('mock /path/to -m -h 0.0.0.0', (_err: Error, commandPromise: Promise<unknown>) =>
        commandPromise.then(resolve),
      );
    });

    expect(createSingleProcessPrism).not.toHaveBeenCalled();
    expect(createMultiProcessPrism).toHaveBeenLastCalledWith({
      operations: [],
      dynamic: false,
      cors: true,
      host: '0.0.0.0',
      port: 4010,
    });
  });
});
