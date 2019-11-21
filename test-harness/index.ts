import { ChildProcess, spawn, spawnSync } from 'child_process';
import * as fs from 'fs';
import { validate } from 'gavel';
import * as globFs from 'glob-fs';
import { parseResponse } from 'http-string-parser';
import * as os from 'os';
import { get } from 'lodash';
import * as path from 'path';
import * as split2 from 'split2';
import * as tmp from 'tmp';
import { parseSpecFile, xmlValidator } from './helpers';

const glob = globFs({ gitignore: true });
jest.setTimeout(5000);

const WAIT_FOR_LINE = 'Server listening at';
const WAIT_FOR_LINE_TIMEOUT = 3000;

describe('harness', () => {
  const files = process.env.TESTS
    ? String(process.env.TESTS).split(',')
    : glob.readdirSync('**/*.txt', { cwd: path.join(__dirname, './specs') });

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

    const testText = `${file}${os.EOL}${parsed.test}`;

    test(testText, done => {
      const [command, ...args] = parsed.command.split(/ +/).map(t => t.trim());

      startPrism(parsed.server, tmpFileHandle.name, (error, prismMockProcessHandle) => {
        if (error) {
          throw error;
        }

        const clientCommandHandle = spawnSync(command, args, {
          shell: true,
          encoding: 'utf8',
          windowsVerbatimArguments: false,
        });
        const output: any = parseResponse(clientCommandHandle.stdout.trim());
        const expected: any = parseResponse((parsed.expect || parsed.expectLoose).trim());

        const isXml = xmlValidator.test(
          get(output, ['header', 'content-type'], ''),
          expected.body
        );

        try {
          if (isXml) {
            return xmlValidator.validate(expected, output).then(res => {
              expect(res).toStrictEqual([]);
              delete expected.body;
              delete output.body;

              const isValid = validate(expected, output).valid;
              expect(isValid).toBeTruthy();

              return shutdownPrism(prismMockProcessHandle, done);
            });
          }

          const isValid = validate(expected, output).valid;

          if (!!isValid) {
            expect(isValid).toBeTruthy();
          } else {
            expect(output).toMatchObject(expected);
          }
          if (parsed.expect) {
            expect(output.body).toStrictEqual(expected.body);
          }
        } finally {
          shutdownPrism(prismMockProcessHandle, done);
        }
      });
    });
  });
});

function startPrism(server, filename, done: (error?: Error, handle?: ChildProcess) => void) {
  const serverArgs = server.split(/ +/).map(t => t.trim().replace('${document}', filename));
  const prismMockProcessHandle = spawn(path.join(__dirname, '../cli-binaries/prism-cli'), serverArgs);

  const timeout = setTimeout(
    () => {
      shutdownPrism(prismMockProcessHandle, () => {
      done(new Error(`Timeout while waiting for "${WAIT_FOR_LINE}" log line`));
      });
    },
    WAIT_FOR_LINE_TIMEOUT
  );

  prismMockProcessHandle.stdout.pipe(split2()).on('data', (line: string) => {
    if (line.includes(WAIT_FOR_LINE)) {
      clearTimeout(timeout);
    done(undefined, prismMockProcessHandle);
    }
  });
}

function shutdownPrism(processHandle: ChildProcess, done: (...args: any[]) => any) {
  processHandle.kill();
  return processHandle.on('exit', done);
}
