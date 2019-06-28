import { parseSpecFile } from './helpers';
import * as fs from 'fs';
import * as path from 'path';
import * as tmp from 'tmp';
import * as cp from 'child_process';
import split2 = require('split2');
import { validate } from 'gavel';
import { parseResponse } from 'http-string-parser';

jest.setTimeout(60000);

describe('harness', () => {
  const files = fs.readdirSync(path.join(__dirname, './specs/'));

  files.forEach(value => {
    const data = fs.readFileSync(path.join(__dirname, './specs/', value), { encoding: 'utf8' });
    const parsed = parseSpecFile(data);

    let prismMockProcessHandle: cp.ChildProcessWithoutNullStreams;
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

    test(parsed.test, done => {
      expect.hasAssertions()
      const [command, ...args] = parsed.command.split(' ').map(t => t.trim());
      const serverArgs = [...parsed.server.split(' ').map(t => t.trim()), tmpFileHandle.name];

      prismMockProcessHandle = cp.spawn(
        path.join(__dirname, '../cli-binaries/prism-cli-linux'),
        serverArgs
      );

      prismMockProcessHandle.stdout.pipe(split2()).on('data', (line: string) => {
        if (line.includes('Prism is listening')) {
          const clientCommandHandle = cp.spawnSync(command, args, { encoding: 'utf8' });
          const output: any = parseResponse(clientCommandHandle.stdout.trim());
          const expected: any = parseResponse(parsed.expect.trim());

          try {
            expect(validate(expected, output).isValid).toBeTruthy();
            if (parsed.expect)
              expect(expected.body).toEqual(output.body)
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
