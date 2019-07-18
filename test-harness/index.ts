import * as Ajv from 'ajv';
import { ChildProcess, spawn, spawnSync } from 'child_process';
import * as fs from 'fs';
import { validate } from 'gavel';
import { parseResponse } from 'http-string-parser';
import * as os from 'os';
import * as path from 'path';
import * as split2 from 'split2';
import * as tmp from 'tmp';
import * as toJsonSchema from 'to-json-schema';
import { parseSpecFile } from './helpers';

jest.setTimeout(60000);

const dynamicHandlers = [
  {
    shouldHandle: value => value.includes('.dynamic-response.'),
    handle: (output, expected) => {
      const schema = toJsonSchema(JSON.parse(expected.body));
      const ajv = new Ajv();

      return ajv.validate(schema, JSON.parse(output.body));
    },
  },
  {
    shouldHandle: value => value.includes('.dynamic-headers.'),
    handle: (output, expected) => {
      return Object.keys(expected.headers).every(expectedHeader => {
        const existingExpectedHeader = output.headers[expectedHeader];

        return existingExpectedHeader && typeof expectedHeader === typeof existingExpectedHeader;
      });
    },
  },
];

describe('harness', () => {
  const files = fs.readdirSync(path.join(__dirname, './specs/'));

  files.forEach(value => {
    const data = fs.readFileSync(path.join(__dirname, './specs/', value), { encoding: 'utf8' });
    const parsed = parseSpecFile(data);

    let prismMockProcessHandle: ChildProcess;
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

    test(`${value}${os.EOL}${parsed.test}`, done => {
      const [command, ...args] = parsed.command.split(' ').map(t => t.trim());
      const serverArgs = [...parsed.server.split(' ').map(t => t.trim()), tmpFileHandle.name];

      prismMockProcessHandle = spawn(path.join(__dirname, '../cli-binaries/prism-cli'), serverArgs);

      prismMockProcessHandle.stdout.pipe(split2()).on('data', (line: string) => {
        if (line.includes('Prism is listening')) {
          const clientCommandHandle = spawnSync(command, args, {
            shell: true,
            encoding: 'utf8',
            windowsVerbatimArguments: false,
          });
          const output: any = parseResponse(clientCommandHandle.stdout.trim());
          const expected: any = parseResponse(parsed.expect.trim());

          try {
            const isValid = validate(expected, output).isValid;

            if (!!isValid) {
              expect(validate(expected, output).isValid).toBeTruthy();
            } else {
              if (dynamicHandlers[1].shouldHandle(value)) {
                expect(dynamicHandlers[1].handle(output, expected)).toBe(true);
              } else {
                expect(output).toMatchObject(expected);
              }
            }

            const possibleDynamicHandler = dynamicHandlers.find(dynamicHandler => dynamicHandler.shouldHandle(value));

            if (possibleDynamicHandler) {
              expect(possibleDynamicHandler.handle(output, expected)).toBe(true);
            } else {
              if (parsed.expect) {
                expect(expected.body).toEqual(output.body);
              }
            }
          } catch (e) {
            prismMockProcessHandle.kill();
            return prismMockProcessHandle.on('exit', () => done(e));
          }
          prismMockProcessHandle.kill();
          prismMockProcessHandle.on('exit', done);
        }
      });
    });
  });
});
