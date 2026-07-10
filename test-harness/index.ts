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

        // For expectKeysOnly and expectLoose, skip the body in toMatchObject and handle separately.
        // With gavel, expect-loose used tv4 treating the expected body as a JSON Schema; since plain
        // JSON objects have no schema keywords, tv4 passed any valid body — so only status/headers
        // were effectively validated.  Replicate that by omitting the body from toMatchObject.
        const { body: _expectedBody, ...expectedWithoutBody } = expected;
        const expectedForMatch = (parsed.expectKeysOnly || parsed.expectLoose) ? expectedWithoutBody : expected;
        expect(output).toMatchObject(expectedForMatch);
        if (parsed.expect) {
          expect(output.body).toStrictEqual(expected.body);
        } else if (parsed.expectKeysOnly) {
          const jsonOutput = JSON.parse(output.body);
          const jsonExpected = JSON.parse(expected.body);
          const actualKeys = Object.keys(jsonOutput);
          const expectedKeys = Object.keys(jsonExpected);
          // All expected keys must be present in actual (actual may have extra keys when
          // additionalProperties is set to a schema; relative order of expected keys must match).
          expect(actualKeys).toEqual(expect.arrayContaining(expectedKeys));
          expect(actualKeys.filter(k => expectedKeys.includes(k))).toStrictEqual(expectedKeys);
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
