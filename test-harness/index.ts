import { parseSpecFile } from './helpers';
import * as fs from 'fs';
import * as path from 'path';
import * as tmp from 'tmp';
import * as cp from 'child_process';
import { toMatchDiffSnapshot } from 'snapshot-diff'
import split2 = require('split2');
import * as os from 'os'

const SNAPSHOT_TITLE = 'Snapshot Diff:\n';

expect.extend({ toMatchDiffSnapshot })
expect.addSnapshotSerializer({
  print: (value: string) => value.split(os.EOL).filter(t => !t.includes('Date')).join(os.EOL),
  test: (value: unknown) => typeof value === 'string' && value.indexOf(SNAPSHOT_TITLE) === 0
});
jest.setTimeout(60000)

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
        unsafeCleanup: undefined
      });

      fs.writeFileSync(tmpFileHandle.name, parsed.spec, { encoding: 'utf8' });
    });

    afterAll(done => {
      tmpFileHandle.removeCallback(null, null, null, null);
      prismMockProcessHandle.kill();
      prismMockProcessHandle.on('exit', done)
    });

    it(parsed.test, done => {
      const [command, ...args] = parsed.command.split(' ').map(t => t.trim());
      const serverArgs = [...parsed.server.split(' ').map(t => t.trim()), tmpFileHandle.name];

      prismMockProcessHandle = cp.spawn(path.join(__dirname, '../cli-binaries/prism-cli-linux'), serverArgs);

      prismMockProcessHandle.stdio.forEach(s => s.pipe(split2()).on('data', (s: string) => prismMockProcessHandle.connected && console.log(s)))
      prismMockProcessHandle.stdout.pipe(split2()).on('data', (line: string) => {
        if (line.includes('Prism is listening')) {
          const clientCommandHandle = cp.spawnSync(command, args, { encoding: 'utf8' });
          const output = clientCommandHandle.stdout.trim()
          const expected = parsed.expect.trim()
          expect(output).toMatchDiffSnapshot(expected);
          done();
        }
      });
    });
  });
});
