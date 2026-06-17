import { ChildProcess, spawn, spawnSync } from 'child_process';
import * as fs from 'fs';
import glob = require('glob');
import { parseResponse } from 'http-string-parser';
import { get } from 'lodash';
import * as path from 'path';
import * as split2 from 'split2';
import * as tmp from 'tmp';
import { parseSpecFile, xmlValidator } from './helpers';

jest.setTimeout(15000);

const WAIT_FOR_LINE = 'Prism is listening';
const WAIT_FOR_LINE_TIMEOUT = 10000;

describe('harness', () => {
  const files = process.env.TESTS
    ? String(process.env.TESTS).split(',')
    : glob.sync('**/*.txt', { cwd: path.join(__dirname, './specs') });

  files.forEach(file => {
    const data = fs.readFileSync(path.join(__dirname, './specs/', file), { encoding: 'utf8' });
    const parsed = parseSpecFile(data);

    let tmpFileHandle: tmp.FileSyncObject;

    beforeAll(() => {
      tmpFileHandle = tmp.fileSync({
        postfix: '.yml',
        dir: undefined,
        name: undefined,
        prefix: undefined,
        tries: 10,
        template: undefined,
        unsafeCleanup: undefined,
      });

      fs.writeFileSync(tmpFileHandle.name, parsed.spec, { encoding: 'utf8' });
    });

    afterAll(() => tmpFileHandle.removeCallback(undefined, undefined, undefined, undefined));
    describe(file, () => {
      let prismHandle: ChildProcess;
      beforeEach(async () => {
        prismHandle = await startPrism(parsed.server, tmpFileHandle.name);
      });

      afterEach(() => {
        return shutdownPrism(prismHandle);
      });

      test(parsed.test, async () => {
        const [command, ...args] = parsed.command.split(/ +/).map(t => t.trim());

        const clientCommandHandle = spawnSync(command, args, {
          shell: true,
          encoding: 'utf8',
          windowsVerbatimArguments: false,
        });
        const output: any = parseResponse(clientCommandHandle.stdout.trim());
        const expected: any = parseResponse((parsed.expect || parsed.expectLoose || parsed.expectKeysOnly).trim());

        // HTTP header names are case-insensitive; normalize to lowercase so comparisons don't fail on casing differences
        if (output.headers) {
          output.headers = Object.fromEntries(Object.entries(output.headers as Record<string, string>).map(([k, v]) => [k.toLowerCase(), v]));
        }
        if (expected.headers) {
          expected.headers = Object.fromEntries(Object.entries(expected.headers as Record<string, string>).map(([k, v]) => [k.toLowerCase(), v]));
        }

        const isXml = xmlValidator.test(get(output, ['header', 'content-type'], ''), expected.body);

        if (isXml) {
          const res = await xmlValidator.validate(expected, output);
          expect(res).toStrictEqual([]);
          delete expected.body;
          delete output.body;
          expect(output).toMatchObject(expected);
          return;
        }

        // For expectKeysOnly, skip the body in toMatchObject since we only verify keys below
        const expectedForMatch = parsed.expectKeysOnly ? { ...expected, body: undefined } : expected;
        expect(output).toMatchObject(expectedForMatch);
        if (parsed.expect) {
          expect(output.body).toStrictEqual(expected.body);
        } else if (parsed.expectKeysOnly) {
          const jsonOutput = JSON.parse(output.body);
          const jsonExpected = JSON.parse(expected.body);
          expect(Object.keys(jsonOutput)).toStrictEqual(Object.keys(jsonExpected));
        }
      });
    });
  });
});

function startPrism(server: string, filename: string): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    const serverArgs = server.split(/ +/).map(t => t.trim().replace('${document}', filename));
    const prismMockProcessHandle = spawn(path.join(__dirname, '../cli-binaries/prism-cli'), serverArgs);

    const timeout = setTimeout(() => {
      shutdownPrism(prismMockProcessHandle);
      reject(new Error(`Timeout while waiting for "${WAIT_FOR_LINE}" log line`));
    }, WAIT_FOR_LINE_TIMEOUT);

    if (process.env.DEBUG) {
      prismMockProcessHandle.stderr.pipe(process.stderr);
    }

    prismMockProcessHandle.stdout.pipe(split2()).on('data', (line: string) => {
      if (line.includes(WAIT_FOR_LINE)) {
        clearTimeout(timeout);
        resolve(prismMockProcessHandle);
      }
    });
  });
}

function shutdownPrism(processHandle: ChildProcess): Promise<void> {
  processHandle.kill();
  return new Promise(resolve => {
    processHandle.on('exit', resolve);
  });
}
