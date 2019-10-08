import * as utils from '@stoplight/prism-http';
import * as yargs from 'yargs';
import { createMultiProcessPrism, createSingleProcessPrism } from '../../util/createServer';
import mockCommand from '../mock';

const parser = yargs.command(mockCommand);

jest.mock('../../util/createServer', () => ({
  createMultiProcessPrism: jest.fn(),
  createSingleProcessPrism: jest.fn(),
}));

jest.spyOn(utils, 'getHttpOperationsFromResource').mockResolvedValue([]);

describe.each([['mock'], ['proxy', 'http://github.com']])('%s command', (command, upstream) => {
  beforeEach(() => {
    (createSingleProcessPrism as jest.Mock).mockClear();
    (createMultiProcessPrism as jest.Mock).mockClear();
  });

  test(`starts ${command} server`, async () => {
    await new Promise(resolve => {
      parser.parse(`${command} /path/to ${upstream}`, (_err: Error, commandPromise: Promise<unknown>) =>
        commandPromise.then(resolve),
      );
    });

    expect(createMultiProcessPrism).not.toHaveBeenCalled();
    expect(createSingleProcessPrism).toHaveBeenLastCalledWith({
      operations: [],
      dynamic: false,
      multiprocess: false,
      log: 'stdout',
      cors: true,
      host: '127.0.0.1',
      port: 4010,
    });
  });

  test(`starts ${command} server on custom port`, async () => {
    await new Promise(resolve => {
      parser.parse(`${command} /path/to -p 666 ${upstream}`, (_err: Error, commandPromise: Promise<unknown>) =>
        commandPromise.then(resolve),
      );
    });

    expect(createMultiProcessPrism).not.toHaveBeenCalled();
    expect(createSingleProcessPrism).toHaveBeenLastCalledWith({
      operations: [],
      dynamic: false,
      multiprocess: false,
      log: 'stdout',
      cors: true,
      host: '127.0.0.1',
      port: 666,
    });
  });

  test(`starts ${command} server on custom host`, async () => {
    await new Promise(resolve => {
      parser.parse(`${command} /path/to -h 0.0.0.0 ${upstream}`, (_err: Error, commandPromise: Promise<unknown>) =>
        commandPromise.then(resolve),
      );
    });

    expect(createMultiProcessPrism).not.toHaveBeenCalled();
    expect(createSingleProcessPrism).toHaveBeenLastCalledWith({
      operations: [],
      dynamic: false,
      multiprocess: false,
      log: 'stdout',
      cors: true,
      host: '0.0.0.0',
      port: 4010,
    });
  });

  test(`starts ${command} server on custom host and port`, async () => {
    await new Promise(resolve => {
      parser.parse(
        `${command} /path/to -p 666 -h 0.0.0.0 ${upstream}`,
        (_err: Error, commandPromise: Promise<unknown>) => commandPromise.then(resolve),
      );
    });

    expect(createMultiProcessPrism).not.toHaveBeenCalled();
    expect(createSingleProcessPrism).toHaveBeenLastCalledWith({
      operations: [],
      cors: true,
      log: 'stdout',
      dynamic: false,
      multiprocess: false,
      host: '0.0.0.0',
      port: 666,
    });
  });

  test(`starts ${command} server with multiprocess option `, async () => {
    await new Promise(resolve => {
      parser.parse(`${command} /path/to -m -h 0.0.0.0 ${upstream}`, (_err: Error, commandPromise: Promise<unknown>) =>
        commandPromise.then(resolve),
      );
    });

    expect(createSingleProcessPrism).not.toHaveBeenCalled();
    expect(createMultiProcessPrism).toHaveBeenLastCalledWith({
      operations: [],
      dynamic: false,
      cors: true,
      log: 'stdout',
      multiprocess: true,
      host: '0.0.0.0',
      port: 4010,
    });
  });

  test(`starts ${command} server with httpResponse log option `, async () => {
    await new Promise(resolve => {
      parser.parse(
        `${command} /path/to -m -h 0.0.0.0 --log httpResponse ${upstream}`,
        (_err: Error, commandPromise: Promise<unknown>) => commandPromise.then(resolve),
      );
    });

    expect(createSingleProcessPrism).not.toHaveBeenCalled();
    expect(createMultiProcessPrism).toHaveBeenLastCalledWith({
      operations: [],
      dynamic: false,
      cors: true,
      log: 'httpResponse',
      multiprocess: true,
      host: '0.0.0.0',
      port: 4010,
    });
  });
});
