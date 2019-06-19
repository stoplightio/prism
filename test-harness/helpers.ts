import * as  fs from 'fs';
import { join } from 'path';
import fetch from 'node-fetch';

export async function makeRequest({ path, method, headers = {}, body }) {
  const opts =
    method === 'GET' || method === 'HEAD'
      ? {}
      : { body: headers['Content-Type'] === 'application/json' ? JSON.stringify(body) : body };
  const baseOpts = Object.assign({}, opts, { method, headers });
  const host = `http://localhost:${process.env.PRISM_PORT || 4010}`;
  const requestConfig = {
    ...baseOpts,
    path,
    host,
  };
  return fetch(`${host}${path}`, requestConfig)
    .then(async response => {
      const { date, ...headers } = response.headers.raw();

      return {
        request: requestConfig,
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: headers,
          body: await response.json(),
        },
      };
    });
}

export function constructMasterFileName(request) {
  return JSON.stringify(request).replace(/[{},":/]/gim, '_');
}

export function readFile(hash) {
  const fileContent = fs.readFileSync(join(__dirname, '/gold-master-files/') + `${hash}.json`).toString();

  return JSON.parse(fileContent);
}
