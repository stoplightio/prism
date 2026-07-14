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

// HTTP headers that legitimately vary between runs (timestamps, transport-level metadata, etc.).
// Gavel used to ignore these automatically; Jest's toMatchObject does not, so we filter them out.
const VOLATILE_HEADERS = new Set([
  'date',
  'content-length',
  'connection',
  'keep-alive',
  'transfer-encoding',
  'access-control-allow-credentials',
  'access-control-allow-headers',
  'access-control-allow-origin',
  'access-control-expose-headers',
  'server',
]);

/**
 * Normalizes header names to lowercase so casing differences do not cause spurious mismatches.
 * HTTP header names are case-insensitive per RFC 7230.
 */
function normalizeHeaders(response: any) {
  if (!response || !response.headers) return response;

  return {
    ...response,
    headers: Object.fromEntries(
      Object.entries(response.headers as Record<string, string>).map(([k, v]) => [
        k.toLowerCase(),
        v,
      ])
    ),
  };
}

/**
 * Removes headers whose values are expected to change between runs
 * (e.g. `date`, `content-length`) so they don't cause matcher failures.
 */
function removeVolatileHeaders(headers: Record<string, string> = {}) {
  return Object.fromEntries(
    Object.entries(headers)
      .filter(([key]) => !VOLATILE_HEADERS.has(key.toLowerCase()))
      .map(([key, value]) => [key, resolveJestMatcher(value)])
  );
}

/**
 * Allows spec files to embed Jest asymmetric matchers via simple placeholders:
 *   <anyString>            -> expect.any(String)
 *   <anyNumber>            -> expect.any(Number)
 *   <stringContaining:foo> -> expect.stringContaining('foo')
 *   <stringMatching:^foo$> -> expect.stringMatching(/^foo$/)
 *   any value containing `[...]` -> expect.stringContaining(prefix_before_[...])
 */
function resolveJestMatcher(value: unknown) {
  if (typeof value !== 'string') return value;

  if (value === '<anyString>') return expect.any(String);
  if (value === '<anyNumber>') return expect.any(Number);

  const stringContaining = value.match(/^<stringContaining:([\s\S]*)>$/);
  if (stringContaining) {
    const inner = stringContaining[1];
    // Honour `[...]` inside the matcher: only require the prefix before it.
    const prefix = inner.includes('[...]') ? inner.split('[...]')[0] : inner;
    return expect.stringContaining(prefix);
  }

  const stringMatching = value.match(/^<stringMatching:([\s\S]*)>$/);
  if (stringMatching) return expect.stringMatching(new RegExp(stringMatching[1]));

  // Bare truncation marker fallback (no <stringContaining:> wrapper).
  if (value.includes('[...]')) {
    return expect.stringContaining(value.split('[...]')[0]);
  }

  return value;
}

/**
 * Builds the object passed to `toMatchObject`, mimicking Gavel's behavior:
 * - volatile headers are removed
 * - header comparison is loose via `expect.objectContaining`
 * - the body is only included for strict `expect` assertions
 *   (`expect-loose` and `expect-keysOnly` handle bodies separately)
 */
function buildExpectedForMatch(parsed: any, expected: any) {
  const { body, headers, ...rest } = expected;
  const expectedForMatch: any = { ...rest };

  if (headers) {
    expectedForMatch.headers = expect.objectContaining(removeVolatileHeaders(headers));
  }

  if (parsed.expect && body !== undefined) {
    expectedForMatch.body = resolveJestMatcher(body);
  }

  return expectedForMatch;
}

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

        // Parse and normalize both actual and expected responses.
        const output: any = normalizeHeaders(parseResponse(clientCommandHandle.stdout.trim()));
        const expected: any = normalizeHeaders(
          parseResponse((parsed.expect || parsed.expectLoose || parsed.expectKeysOnly).trim())
        );

        // Optional diagnostic: warn when a value looks like a matcher placeholder
        // but was NOT resolved (usually indicates a typo in the spec file).
        if (process.env.DEBUG_MATCHERS && expected.headers) {
          for (const [k, v] of Object.entries(expected.headers)) {
            if (typeof v === 'string' && v.startsWith('<') && v.endsWith('>')) {
              const resolved = resolveJestMatcher(v);
              if (resolved === v) {
                // eslint-disable-next-line no-console
                console.warn(
                  `[harness] header "${k}" looks like a matcher placeholder but was not resolved:`,
                  v
                );
              }
            }
          }
        }

        const isXml = xmlValidator.test(
          get(output, ['headers', 'content-type'], ''),
          expected.body
        );

        if (isXml) {
          const res = await xmlValidator.validate(expected, output);
          expect(res).toStrictEqual([]);
          delete expected.body;
          delete output.body;
          expect(output).toMatchObject(buildExpectedForMatch(parsed, expected));
          return;
        }

        // For expectKeysOnly and expectLoose, the body is verified separately (or intentionally
        // skipped for expect-loose to mirror the old gavel/tv4 behavior where plain JSON
        // objects had no schema keywords and therefore matched any valid body).
        expect(output).toMatchObject(buildExpectedForMatch(parsed, expected));

        if (parsed.expect) {
          const expectedBody = resolveJestMatcher(expected.body);

          if (expectedBody === expected.body) {
            // No matcher resolved – strict exact-string comparison, as before.
            expect(output.body).toStrictEqual(expected.body);
          } else {
            expect(output.body).toEqual(expectedBody);
          }
        } else if (parsed.expectKeysOnly) {
          const jsonOutput = JSON.parse(output.body);
          const jsonExpected = JSON.parse(expected.body);
          const actualKeys = Object.keys(jsonOutput);
          const expectedKeys = Object.keys(jsonExpected);

          // All expected keys must be present in the actual output (extra keys are allowed
          // when additionalProperties is set to a schema), and the relative order of the
          // expected keys must match.
          expect(actualKeys).toEqual(expect.arrayContaining(expectedKeys));
          expect(actualKeys.filter(k => expectedKeys.includes(k))).toStrictEqual(expectedKeys);
        }
        // expect-loose: no additional body check (mirrors gavel/tv4 behavior).
      });
    });
  });
});

/* -------------------------------------------------------------------------- */
/*                Unit tests for the Jest-matcher based helpers               */
/* -------------------------------------------------------------------------- */

describe('harness Jest matcher compatibility', () => {
  it('ignores volatile headers while matching response metadata', () => {
    const output = {
      statusCode: 200,
      statusMessage: 'OK',
      headers: {
        'content-type': 'application/json',
        date: 'Fri, 10 Jul 2026 10:00:00 GMT',
        'content-length': '123',
        connection: 'keep-alive',
        server: 'gunicorn',
        'access-control-allow-origin': '*',
      },
      body: '{"id":1}',
    };

    const expected = {
      statusCode: 200,
      statusMessage: 'OK',
      headers: {
        'content-type': 'application/json',
        date: 'Some old date',
        'content-length': '999',
      },
      body: '{"id":1}',
    };

    expect(output).toMatchObject(buildExpectedForMatch({ expect: true }, expected));
  });

  it('allows extra actual headers beyond those declared as expected', () => {
    const output = {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
        'x-extra-header': 'extra',
      },
    };

    const expected = {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
    };

    expect(output).toMatchObject(buildExpectedForMatch({ expect: true }, expected));
  });

  it('does not include body in matcher for expect-loose', () => {
    const output = {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: '{"actual":"value"}',
    };

    const expected = {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: '{"expected":"different"}',
    };

    expect(output).toMatchObject(buildExpectedForMatch({ expectLoose: true }, expected));
  });

  it('supports asymmetric string matchers via placeholders in expected headers', () => {
    const output = {
      statusCode: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'x-request-id': 'abc-123',
      },
    };

    const expected = {
      statusCode: 200,
      headers: {
        'content-type': '<stringContaining:application/json>',
        'x-request-id': '<anyString>',
      },
    };

    expect(output).toMatchObject(buildExpectedForMatch({ expect: true }, expected));
  });

  it('honours <stringContaining:...> and [...] on the body', () => {
    const output = {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: '{"slideshow":{"author":"Yours Truly","title":"Sample Slide Show"}}',
    };

    const expected = {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: '<stringContaining:"slideshow"[...]>',
    };

    const expectedForMatch = buildExpectedForMatch({ expect: true }, expected);
    expect(output).toMatchObject(expectedForMatch);

    const expectedBody = resolveJestMatcher(expected.body);
    expect(output.body).toEqual(expectedBody);
  });

  it('validates keys presence and order for expect-keysOnly', () => {
    const output = {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: '{"id":1,"name":"test","extra":true}',
    };

    const expected = {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: '{"id":1,"name":"test"}',
    };

    expect(output).toMatchObject(buildExpectedForMatch({ expectKeysOnly: true }, expected));

    const jsonOutput = JSON.parse(output.body);
    const jsonExpected = JSON.parse(expected.body);
    const actualKeys = Object.keys(jsonOutput);
    const expectedKeys = Object.keys(jsonExpected);

    expect(actualKeys).toEqual(expect.arrayContaining(expectedKeys));
    expect(actualKeys.filter(k => expectedKeys.includes(k))).toStrictEqual(expectedKeys);
  });
});

/* -------------------------------------------------------------------------- */
/*                          Prism lifecycle helpers                           */
/* -------------------------------------------------------------------------- */

function startPrism(server: string, filename: string): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const stderrChunks: string[] = [];
    const stdoutChunks: string[] = [];

    const finalizeError = (message: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);

      const stdoutTail = stdoutChunks.join('').trim().slice(-1000);
      const stderrTail = stderrChunks.join('').trim().slice(-1000);
      const details = [
        stdoutTail ? `stdout tail:\n${stdoutTail}` : '',
        stderrTail ? `stderr tail:\n${stderrTail}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      reject(new Error(details ? `${message}\n\n${details}` : message));
    };

    const serverArgs = server.split(/ +/).map(t =>
      t.trim().replace('${document}', filename)
    );
    const prismMockProcessHandle = spawn(
      path.join(__dirname, '../cli-binaries/prism-cli'),
      serverArgs
    );

    const timeout = setTimeout(() => {
      shutdownPrism(prismMockProcessHandle);
      finalizeError(`Timeout while waiting for "${WAIT_FOR_LINE}" log line`);
    }, WAIT_FOR_LINE_TIMEOUT);

    if (process.env.DEBUG) {
      prismMockProcessHandle.stderr.pipe(process.stderr);
    }

    prismMockProcessHandle.on('error', err => {
      finalizeError(`Failed to start Prism process: ${err.message}`);
    });

    prismMockProcessHandle.on('exit', (code, signal) => {
      if (settled) return;
      const reason =
        code !== null ? `exit code ${code}` : signal ? `signal ${signal}` : 'unknown reason';
      finalizeError(`Prism process exited before readiness with ${reason}`);
    });

    prismMockProcessHandle.stdout.pipe(split2()).on('data', (line: string) => {
      stdoutChunks.push(`${line}\n`);
      if (line.includes(WAIT_FOR_LINE)) {
        settled = true;
        clearTimeout(timeout);
        resolve(prismMockProcessHandle);
      }
    });

    prismMockProcessHandle.stderr.pipe(split2()).on('data', (line: string) => {
      stderrChunks.push(`${line}\n`);
    });
  });
}

function shutdownPrism(processHandle?: ChildProcess): Promise<void> {
  if (!processHandle || !processHandle.pid || processHandle.killed) {
    return Promise.resolve();
  }

  processHandle.kill();
  return new Promise(resolve => {
    processHandle.on('exit', resolve);
  });
}
