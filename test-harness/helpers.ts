const fs = require('fs');
const { join } = require('path');
const fetch = require('node-fetch');

async function makeRequest({ path, method, headers = {}, body }) {
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
    })
    .catch(err => {
      console.log('err', err);
    });
}

function constructMasterFileName(request) {
  return JSON.stringify(request).replace(/[{},":/]/gim, '_');
}

function readFile(hash) {
  const fileContent = fs.readFileSync(join(__dirname, '/gold-master-files/') + `${hash}.json`).toString();

  return JSON.parse(fileContent);
}

module.exports = {
  constructMasterFileName,
  makeRequest,
  readFile,
};
