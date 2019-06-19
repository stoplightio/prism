const fs = require('fs');
const { join } = require('path');
const { omit } = require('lodash')
const requests = require('./requests');

const { makeRequest, constructMasterFileName } = require('./helpers');

async function recordMasterFile({ path, method, headers, body }) {
  const reqRes = await makeRequest({ path, method, headers, body });

  try {
    fs.writeFileSync(
      `${join(
        __dirname,
        '/gold-master-files/',
        constructMasterFileName({
          path,
          method,
          headers,
          body,
        }))
      }.json`,
      `${JSON.stringify(omit(reqRes, 'request.host'), null, 2)}\n`
    )
  } catch (err) {
    console.error(err);
  }
}

(async function () {
  await Promise.all(requests.map(recordMasterFile));
})();
