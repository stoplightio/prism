const fs = require('fs');
const requests = require('./requests');

const { makeRequest, constructMasterFileName } = require('./helpers');

async function recordMasterFile({ path, method, headers, body }) {
  const reqRes = await makeRequest({ path, method, headers, body });

  try {
    fs.writeFileSync(
      `${__dirname}/gold-master-files/${constructMasterFileName({
        path,
        method,
        headers,
        body,
      })}.json`,
      JSON.stringify(reqRes, null, 2)
    );
  } catch (err) {
    console.error(err);
  }
}

(async function() {
  for (const request of requests) {
    const { dynamic, ...req} = request;

    await recordMasterFile(req);
  }
})();
