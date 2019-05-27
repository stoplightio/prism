const { join } = require('path');
const fetch = require('node-fetch');
const requests = require('./requests');

const { exec } = require('child_process');
const { getPort, makeRequest, constructMasterFileName, readFile } = require('./helpers');

const port = getPort(process);

async function waitForPrism(done) {
  try {
    await fetch(`http://localhost:${port}`);
    done();
  } catch (err) {
    setTimeout(() => {
      waitForPrism(done);
    }, 500);
  }
}

async function runTest(req) {
  const { dynamic, ...request } = req;

  const masterFileName = constructMasterFileName(request);
  const masterFile = readFile(masterFileName);

  const reqRes = await makeRequest(request);

  return {
    reqRes,
    masterFile,
  };
}

function killPrism(done = () => null) {
  exec(`fuser -k ${port}/tcp`, () => {
    done();
  });
}

const spec = process.env.SPEC || join(__dirname, '/../examples/petstore.oas2.json');
const specs = spec.split(',');

const createSpec = (specPath, prismCmd) => {
  return () => {
    describe(specPath, () => {
      beforeAll(done => {
        killPrism();

        exec(prismCmd);

        waitForPrism(done);
      });

      afterAll(done => {
        killPrism(done);
      });

      describe('When a required parameter is missing in query (with no default)', () => {
        test('"Missing X query param" error is returned', async () => {
          const { reqRes, masterFile } = await runTest(requests[0]);

          expect(reqRes).toStrictEqual(masterFile);
        });

        xdescribe('When authorization needed', () => {
          test('"Missing X query param" error is returned', async () => {
            const { reqRes, masterFile } = await runTest(requests[2]);

            expect(reqRes).toStrictEqual(masterFile);
          });
        });
      });

      describe('When sending a POST with all the needed params in body', () => {
        describe('Dynamic response', () => {
          test('should default to 200 and mock from schema', async () => {
            const { reqRes, masterFile } = await runTest(requests[11]);
            const payload = reqRes.response.body;

            expect(reqRes.response.status).toBe(masterFile.response.status);
            expect(reqRes.response.status).toBe(200);

            expect(payload).toHaveProperty('id');
            expect(payload).toHaveProperty('username');
            expect(payload).toHaveProperty('firstName');
            expect(payload).toHaveProperty('lastName');
            expect(payload).toHaveProperty('email');
            expect(payload).toHaveProperty('password');
            expect(payload).toHaveProperty('phone');
            expect(payload).toHaveProperty('userStatus');
          });
        });
      });

      describe('When sending a GET with all the needed parameters in query', () => {
        describe('Static response', () => {
          test('A response with status code 200 is returned', async () => {
            const { reqRes, masterFile } = await runTest(requests[1]);

            expect(reqRes).toStrictEqual(masterFile);
          });
        });
      });

      xdescribe('Authorization', () => {
        xdescribe('When a request does not include authorization details', () => {
          test(['Should get 401 for not being authorized', 'NOT_IN_V3:SO-176'].join(), async () => {
            const { reqRes, masterFile } = await runTest(requests[3]);

            expect(reqRes.response.status).toBe(401);
            // expect(reqRes.response.status).toBe(masterFile.response.status);
          });
        });
      });

      describe('Dynamic paths', () => {
        describe('When a resource is request from a dynamic path like /pets/{petId}', () => {
          describe('Dynamic response', () => {
            test('The resource is sent back with a proper schema', async () => {
              const { reqRes, masterFile } = await runTest(requests[4]);
              const payload = reqRes.response.body;

              expect(reqRes.response.status).toBe(masterFile.response.status);

              expect(payload.name).toBeDefined();
              expect(payload.photoUrls).toBeDefined();
              expect(payload.id).toBeDefined();
              expect(payload.category).toBeDefined();
              expect(payload.tags).toBeDefined();
              expect(payload.status).toBeDefined();
            });
          });
        });
      });

      xdescribe('When a form data is sent with application/x-www-form-urlencoded to create a single resource', () => {
        test(
          [
            'Should answer with JSON representing the resource',
            'prism v3 does not respect x-ww-form-urlencoded',
          ].join(),
          async () => {
            const { reqRes, masterFile } = await runTest(requests[5]);

            expect(reqRes.response.status).toBe(masterFile.response.status);
            expect(reqRes.response.status).toBe(200);
          }
        );
      });

      describe('When using a verb that is not defined on a path', () => {
        test(['Informs with 405 that the verb is not served', 'doesnt matter if auth implemented'].join(), async () => {
          const { reqRes, masterFile } = await runTest(requests[6]);

          expect(reqRes).toStrictEqual(masterFile);
        });
      });

      describe('When a response with a specific status code is requested using the __code property', () => {
        describe('When an existing code is requested', () => {
          describe('static response', () => {
            test(
              'Requested response for the given __code is returned with payload',
              async () => {
                const { reqRes, masterFile } = await runTest(requests[7]);

                expect(reqRes).toStrictEqual(masterFile);
              }
            );
          });

          describe('Dynamic response', () => {
            test('Requested response is generated and returned', async () => {
              const { reqRes, masterFile } = await runTest(requests[8]);
              const payload = reqRes.response.body;

              expect(reqRes.response.status).toBe(masterFile.response.status);

              expect(payload.name).toBeDefined();
              expect(payload.photoUrls).toBeDefined();
              expect(payload.id).toBeDefined();
              expect(payload.category).toBeDefined();
              expect(payload.tags).toBeDefined();
              expect(payload.status).toBeDefined();
            });
          });
        });

        describe('When a non existing code is requested', () => {
          describe('When there is a default response', () => {
            test('will return the default response', async () => {
              const { reqRes, masterFile } = await runTest(requests[14]);
              const payload = reqRes.response.body;

              expect(payload.code).toBeDefined();
              expect(payload.message).toBeDefined();
              expect(reqRes.response.status).toBe(masterFile.response.status);
            });
          });

          describe('there is no default response', () => {
            test('500 code is returned with error', async () => {
              const { reqRes, masterFile } = await runTest(requests[15]);

              expect(reqRes).toStrictEqual(masterFile);
            });
          });
        });
      });

      xdescribe('When multiple values are provided for a single parameter in query', () => {
        test(
          [
            'Returns results possibly including entities with either of these values',
            'doesnt seem to work properly',
          ].join(),
          async () => {
            const { reqRes, masterFile } = await runTest(requests[10]);

            const soldAndOrAvailable = reqRes.response.body.filter(
              ({ status }) => !(status === 'sold' || status === 'available')
            );

            expect(soldAndOrAvailable.length).toBe(0);
            expect(reqRes.response.status).toBe(masterFile.response.status);
          }
        );
      });

      describe('Body parameters', () => {
        describe('When sending all required parameters', () => {
          describe('Dynamic response', () => {
            test('should validate body params', async () => {
              const { reqRes, masterFile } = await runTest(requests[12]);
              const payload = reqRes.response.body;

              expect(reqRes.response.status).toBe(masterFile.response.status);
              expect(reqRes.response.status).toBe(200);
            });
          });
        });

        describe('When not sending all required parameters', () => {
          test('should validate the body params and return an error code', async () => {
            const { reqRes, masterFile } = await runTest(requests[13]);
            const payload = reqRes.response.body;

            expect(reqRes).toStrictEqual(masterFile);

            expect(payload.detail).toContain("should have required property 'name'");
            expect(reqRes.response.status).toBe(masterFile.response.status);
            expect(reqRes.response.status).toBe(422);
          });
        });
      });
    });
  };
};

const binary = `BINARY=${process.env.BINARY || join(__dirname, '/../cli-binaries/prism-cli-linux')}`;

specs.forEach(specPath => {
  const command = `${binary} SPEC=${specPath} PRISM_PORT=${port} yarn run.binary`;

  createSpec(specPath, command)();
});

if (process.env.RUN_V2_TESTS) {
  describe('prism v2', () => {
    createSpec('./examples/petstore.oas2.json', `PRISM_PORT=${port} yarn run.binary.v2`)();
  });
}
