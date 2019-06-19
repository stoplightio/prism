import * as fs from 'fs'
import { join } from 'path'
import { omit } from 'lodash'
import requests from './requests'

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

Promise.all(requests.map(recordMasterFile));
