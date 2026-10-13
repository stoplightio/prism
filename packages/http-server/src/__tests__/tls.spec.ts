import { createLogger } from '@stoplight/prism-core';
import { getHttpOperationsFromSpec } from '@stoplight/prism-http';
import { execFileSync } from 'child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { resolve } from 'path';
import fetch from 'node-fetch';
import { Agent } from 'https';
import { createServer } from '../';
import { ITlsOptions, ThenArg } from '../types';

const logger = createLogger('TEST', { enabled: false });
const specPath = resolve(__dirname, 'fixtures', 'petstore.no-auth.oas3.yaml');

let certDir: string;
let caCert: Buffer;

// Generate a CA, a server cert (SAN localhost/127.0.0.1) and a client cert, all via openssl.
beforeAll(() => {
  certDir = mkdtempSync(join(tmpdir(), 'prism-tls-'));
  const f = (name: string) => join(certDir, name);
  const run = (args: string[]) => execFileSync('openssl', args, { stdio: 'ignore' });

  writeFileSync(f('san.ext'), 'subjectAltName=DNS:localhost,IP:127.0.0.1');

  run(['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', f('ca.key'), '-out', f('ca.crt'), '-days', '1', '-subj', '/CN=Test CA']);
  run(['req', '-newkey', 'rsa:2048', '-nodes', '-keyout', f('server.key'), '-out', f('server.csr'), '-subj', '/CN=localhost']);
  run(['x509', '-req', '-in', f('server.csr'), '-CA', f('ca.crt'), '-CAkey', f('ca.key'), '-CAcreateserial', '-out', f('server.crt'), '-days', '1', '-extfile', f('san.ext')]);
  run(['req', '-newkey', 'rsa:2048', '-nodes', '-keyout', f('client.key'), '-out', f('client.csr'), '-subj', '/CN=test-client']);
  run(['x509', '-req', '-in', f('client.csr'), '-CA', f('ca.crt'), '-CAkey', f('ca.key'), '-CAcreateserial', '-out', f('client.crt'), '-days', '1']);

  caCert = readFileSync(f('ca.crt'));
}, 30000);

afterAll(() => {
  if (certDir) rmSync(certDir, { recursive: true, force: true });
});

async function instantiate(tls: ITlsOptions, port: number) {
  const operations = await getHttpOperationsFromSpec(specPath);
  const server = createServer(operations, {
    components: { logger },
    config: {
      checkSecurity: true,
      validateRequest: true,
      validateResponse: true,
      errors: false,
      mock: { dynamic: false },
      upstreamProxy: undefined,
      isProxy: false,
    },
    cors: true,
    tls,
  });
  const address = await server.listen(port, '127.0.0.1');
  return { close: server.close.bind(server), address };
}

const f = (name: string) => join(certDir, name);

describe('TLS termination', () => {
  let server: ThenArg<ReturnType<typeof instantiate>>;

  afterEach(() => server && server.close());

  it('serves over HTTPS and reports an https:// address', async () => {
    server = await instantiate({ key: readFileSync(f('server.key')), cert: readFileSync(f('server.crt')) }, 30441);

    expect(server.address).toMatch(/^https:\/\//);

    const res = await fetch(`${server.address}/no_auth/pets?name=fido`, {
      agent: new Agent({ ca: caCert }),
    });
    expect(res.status).toBe(200);
  });
});

describe('mTLS termination', () => {
  let server: ThenArg<ReturnType<typeof instantiate>>;

  afterEach(() => server && server.close());

  it('rejects a request without a client certificate', async () => {
    server = await instantiate(
      { key: readFileSync(f('server.key')), cert: readFileSync(f('server.crt')), ca: caCert, requestCert: true, rejectUnauthorized: true },
      30442
    );

    await expect(
      fetch(`${server.address}/no_auth/pets?name=fido`, { agent: new Agent({ ca: caCert }) })
    ).rejects.toThrow();
  });

  it('accepts a request with a valid client certificate', async () => {
    server = await instantiate(
      { key: readFileSync(f('server.key')), cert: readFileSync(f('server.crt')), ca: caCert, requestCert: true, rejectUnauthorized: true },
      30443
    );

    const res = await fetch(`${server.address}/no_auth/pets?name=fido`, {
      agent: new Agent({ ca: caCert, cert: readFileSync(f('client.crt')), key: readFileSync(f('client.key')) }),
    });
    expect(res.status).toBe(200);
  });
});
