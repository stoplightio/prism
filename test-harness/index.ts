import { join } from 'path';
import { constructMasterFileName, makeRequest, readFile } from './helpers';
import requests from './requests';

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

const spec = process.env.SPEC || join(__dirname, '/../examples/petstore.oas2.json');

const createSpec = specPath => {
  return () => {
    describe(specPath, () => {
      describe('When validating a supported server', () => {
        it('with http schema should return 200', async () => {
          const { reqRes } = await runTest(requests[18]);

          expect(reqRes.response.status).toBe(200);
        });

        it('with https schema should return 200', async () => {
          const { reqRes } = await runTest(requests[19]);

          expect(reqRes.response.status).toBe(200);
        });
      });

      describe('When validating an unsupported server', () => {
        it('should return json problem', async () => {
          const { reqRes, masterFile } = await runTest(requests[20]);

          expect(reqRes).toMatchObject(masterFile);
        });
      });

      describe('When a required parameter is missing in query (with no default)', () => {
        it('"Missing X query param" error is returned', async () => {
          const { reqRes, masterFile } = await runTest(requests[0]);

          expect(reqRes).toMatchObject(masterFile);
        });

        xdescribe('When authorization needed', () => {
          it('"Missing X query param" error is returned', async () => {
            const { reqRes, masterFile } = await runTest(requests[2]);

            expect(reqRes).toMatchObject(masterFile);
          });
        });
      });

      describe('When sending a POST with all the needed params in body', () => {
        describe('Dynamic response', () => {
          it('should default to 200 and mock from schema', async () => {
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
          it('A response with status code 200 is returned', async () => {
            const { reqRes, masterFile } = await runTest(requests[1]);

            expect(reqRes).toMatchObject(masterFile);
          });
        });
      });

      xdescribe('Authorization', () => {
        xdescribe('When a request does not include authorization details', () => {
          it(['Should get 401 for not being authorized', 'NOT_IN_V3:SO-176'].join(), async () => {
            const { reqRes, masterFile } = await runTest(requests[3]);

            expect(reqRes.response.status).toBe(401);
            // expect(reqRes.response.status).toBe(masterFile.response.status);
          });
        });
      });

      describe('Dynamic paths', () => {
        describe('When a resource is request from a dynamic path like /pets/{petId}', () => {
          describe('Dynamic response', () => {
            it('The resource is sent back with a proper schema', async () => {
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
        it(
          [
            'Should answer with JSON representing the resource',
            'prism v3 does not respect x-ww-form-urlencoded',
          ].join(),
          async () => {
            const { reqRes, masterFile } = await runTest(requests[5]);

            expect(reqRes.response.status).toBe(masterFile.response.status);
            expect(reqRes.response.status).toBe(200);
          },
        );
      });

      describe('When using a verb that is not defined on a path', () => {
        it(['Informs with 405 that the verb is not served', 'doesnt matter if auth implemented'].join(), async () => {
          const { reqRes, masterFile } = await runTest(requests[6]);

          expect(reqRes).toMatchObject(masterFile);
        });
      });

      describe('When a response with a specific status code is requested using the __code property', () => {
        describe('When an existing code is requested', () => {
          describe('static response', () => {
            it('Requested response for the given __code is returned with payload', async () => {
              const { reqRes, masterFile } = await runTest(requests[7]);

              expect(reqRes).toMatchObject(masterFile);
            });
          });

          describe('Dynamic response', () => {
            it('Requested response is generated and returned', async () => {
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
            it('will return the default response', async () => {
              const { reqRes, masterFile } = await runTest(requests[14]);
              const payload = reqRes.response.body;

              expect(payload.code).toBeDefined();
              expect(payload.message).toBeDefined();
              expect(reqRes.response.status).toBe(masterFile.response.status);
            });
          });

          describe('there is no default response', () => {
            it('500 code is returned with error', async () => {
              const { reqRes, masterFile } = await runTest(requests[15]);

              expect(reqRes).toMatchObject(masterFile);
            });
          });
        });
      });

      xdescribe('When multiple values are provided for a single parameter in query', () => {
        it(
          [
            'Returns results possibly including entities with either of these values',
            'doesnt seem to work properly',
          ].join(),
          async () => {
            const { reqRes, masterFile } = await runTest(requests[10]);

            const soldAndOrAvailable = reqRes.response.body.filter(
              ({ status }) => !(status === 'sold' || status === 'available'),
            );

            expect(soldAndOrAvailable.length).toBe(0);
            expect(reqRes.response.status).toBe(masterFile.response.status);
          },
        );
      });

      describe('Body parameters', () => {
        describe('When sending all required parameters', () => {
          describe('Dynamic response', () => {
            it('should validate body params', async () => {
              const { reqRes, masterFile } = await runTest(requests[12]);

              expect(reqRes.response.status).toBe(masterFile.response.status);
              expect(reqRes.response.status).toBe(200);
            });
          });
        });

        describe('When not sending all required parameters', () => {
          it('should validate the body params and return an error code', async () => {
            const { reqRes, masterFile } = await runTest(requests[13]);
            const payload = reqRes.response.body;

            expect(reqRes).toMatchObject(masterFile);

            expect(payload.detail).toContain(
              'Your request body is not valid and no HTTP validation response was found in the spec, so Prism is generating this error for you.',
            );
            expect(reqRes.response.status).toBe(masterFile.response.status);
            expect(reqRes.response.status).toBe(422);
          });
        });

        describe('content type parser', () => {
          const cases = [
            ['application/json', false],
            ['application/vnd.api+json', false],
            ['application/xml', true],
            ['application/vnd.json', true],
            ['application/vnd.xml;x=json', true],
          ];
          it.each(cases)('%s', async (contentType, shouldError) => {
            const result = await makeRequest({
              path: '/no_auth/pets',
              method: 'POST',
              headers: {
                'content-type': contentType,
              },
              body: JSON.stringify({ hello: 10 }),
            });

            if (shouldError) {
              return expect(result.response.status).toBe(415);
            }

            return expect(result.response.status).not.toBe(415);
          });
        });
      });
    });
  };
};

createSpec(spec)();
