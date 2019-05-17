const fetch = require('node-fetch');
const requests = require('./requests');

const {exec} = require('child_process');
const {makeRequest, constructMasterFileName, readFile} = require('./helpers');

async function waitForPrism(done) {
  try {
    await fetch('http://localhost:4010');
    done();
  } catch (err) {
    setTimeout(() => {
      waitForPrism(done);
    }, 500);
  }
}

async function runTest(request) {
  const masterFileName = constructMasterFileName(request);
  const masterFile = readFile(masterFileName);

  const reqRes = await makeRequest(request);

  return {
    reqRes,
    masterFile,
  };
}

function killPrism() {
  exec('fuser -k 4010/tcp');
}

describe('Test harness', () => {
  beforeAll(done => {
    killPrism();

    exec(`BINARY=${process.env.BINARY || 'prism-cli-linux'} SPEC=${process.env.SPEC || 'petstore.oas2.json'} yarn run.binary`);

    waitForPrism(done);
  });

  afterAll(() => {
    killPrism(); //TODO:ensure that prism is killed
  });

  describe('Validate missing required parameter error', () => {
    test(['Missing required Parameter Error', 'not-dynamic'].join(), async () => {
      const {reqRes, masterFile} = await runTest(requests[0]);

      expect(reqRes).toStrictEqual(masterFile);
    });
  });

  describe('Add missing query parameter from #1', () => {
    test(['(Not)dynamically generated Response with status code 200', 'not-dynamic'].join(), async () => {
      const {reqRes, masterFile} = await runTest(requests[1]);

      expect(reqRes).toStrictEqual(masterFile);
    });
  });

  describe('Validate missing required parameter', () => {
    test(['Missing Requried Parameter Error', 'not-dynamic'].join(), async () => {
      const {reqRes, masterFile} = await runTest(requests[2]);

      expect(reqRes).toStrictEqual(masterFile);
    });
  });

  xdescribe('Add missing query parameter from #3', () => {
    test(['Should get 401 for not being authorized', 'dynamic', 'NOT_IN_V3:SO-176'].join(), async () => {
      const {reqRes, masterFile} = await runTest(requests[3]);

      expect(reqRes.response.status).toBe(401);
      // expect(reqRes.response.status).toBe(masterFile.response.status);
    });
  });
});
