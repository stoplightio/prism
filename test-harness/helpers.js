const fetch = require('node-fetch');
const fs = require('fs');

async function makeRequest({ path, method, headers = {}, body}) {
  const opts = method === 'GET' ? {} : { body };
  const baseOpts = Object.assign({}, opts, { method, headers });
  const host = 'http://localhost:4010';
  const requestConfig = {
    ...baseOpts,
    path,
    host
  };

  return fetch(`${host}${path}`, requestConfig).then(async response => {
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

function constructMasterFileName(request) {
  return JSON.stringify(request).replace(/[{},":/]/gim, '_');
}

function readFile(hash) {
  const fileContent = fs.readFileSync(`${__dirname}/gold-master-files/${hash}.json`).toString();

  return JSON.parse(fileContent);
}

module.exports = {
  constructMasterFileName,
  makeRequest,
  readFile,
};
