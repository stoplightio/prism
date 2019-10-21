import * as prismHttp from '@stoplight/prism-http';
import * as yargs from 'yargs';
import { createMultiProcessPrism, createSingleProcessPrism } from '../../util/createServer';
import mockCommand from '../mock';
import proxyCommand from '../proxy';

const parser = yargs.command(mockCommand).command(proxyCommand);

jest.mock('../../util/createServer', () => ({
  createMultiProcessPrism: jest.fn().mockResolvedValue([]),
  createSingleProcessPrism: jest.fn().mockResolvedValue([]),
}));

jest.spyOn(prismHttp, 'getHttpOperationsFromResource').mockResolvedValue([]);

describe.each<{ 0: string; 1: string; 2: unknown }>([
  ['mock', '', { dynamic: false }],
  ['proxy', 'http://github.com', { upstream: new URL('http://github.com/') }],
])('%s command', (command, upstream, additionalCallOptions) => {
  beforeEach(() => {
    (createSingleProcessPrism as jest.Mock).mockClear();
    (createMultiProcessPrism as jest.Mock).mockClear();
  });

  test(`starts ${command} server`, () => {
    parser.parse(`${command} /path/to ${upstream}`);

    expect(createMultiProcessPrism).not.toHaveBeenCalled();
    expect(createSingleProcessPrism).toHaveBeenLastCalledWith({
      document: '/path/to',
      multiprocess: false,
      reportViolations: 'stdout',
      cors: true,
      host: '127.0.0.1',
      port: 4010,
      ...additionalCallOptions,
    });
  });

  test(`starts ${command} server on custom port`, () => {
    parser.parse(`${command} /path/to -p 666 ${upstream}`);

    expect(createMultiProcessPrism).not.toHaveBeenCalled();
    expect(createSingleProcessPrism).toHaveBeenLastCalledWith({
      document: '/path/to',
      multiprocess: false,
      reportViolations: 'stdout',
      cors: true,
      host: '127.0.0.1',
      port: 666,
      ...additionalCallOptions,
    });
  });

  test(`starts ${command} server on custom host`, () => {
    parser.parse(`${command} /path/to -h 0.0.0.0 ${upstream}`);

    expect(createMultiProcessPrism).not.toHaveBeenCalled();
    expect(createSingleProcessPrism).toHaveBeenLastCalledWith({
      document: '/path/to',
      multiprocess: false,
      reportViolations: 'stdout',
      cors: true,
      host: '0.0.0.0',
      port: 4010,
      ...additionalCallOptions,
    });
  });

  test(`starts ${command} server on custom host and port`, () => {
    parser.parse(`${command} /path/to -p 666 -h 0.0.0.0 ${upstream}`);

    expect(createMultiProcessPrism).not.toHaveBeenCalled();
    expect(createSingleProcessPrism).toHaveBeenLastCalledWith({
      document: '/path/to',
      cors: true,
      reportViolations: 'stdout',
      multiprocess: false,
      host: '0.0.0.0',
      port: 666,
      ...additionalCallOptions,
    });
  });

  test(`starts ${command} server with multiprocess option `, () => {
    parser.parse(`${command} /path/to -m -h 0.0.0.0 ${upstream}`);

    expect(createSingleProcessPrism).not.toHaveBeenCalled();
    expect(createMultiProcessPrism).toHaveBeenLastCalledWith({
      document: '/path/to',
      cors: true,
      reportViolations: 'stdout',
      multiprocess: true,
      host: '0.0.0.0',
      port: 4010,
      ...additionalCallOptions,
    });
  });

  test(`starts ${command} server with httpBody reportViolations option `, () => {
    parser.parse(`${command} /path/to -m -h 0.0.0.0 --report-violations httpBody ${upstream}`);

    expect(createMultiProcessPrism).toHaveBeenLastCalledWith({
      document: '/path/to',
      cors: true,
      reportViolations: 'httpBody',
      multiprocess: true,
      host: '0.0.0.0',
      port: 4010,
      ...additionalCallOptions,
    });
  });
});
