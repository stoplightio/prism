import { assertLeft, assertRight } from '@stoplight/prism-http/src/__tests__/utils';
import { IHttpOperation, IServer } from '@stoplight/types';
import { Chance } from 'chance';
import { IHttpMethod, ProblemJsonError } from '../../';
import {
  NO_METHOD_MATCHED_ERROR,
  NO_PATH_MATCHED_ERROR,
  NO_RESOURCE_PROVIDED_ERROR,
  NO_SERVER_CONFIGURATION_PROVIDED_ERROR,
  NO_SERVER_MATCHED_ERROR,
} from '../errors';
import { router } from '../index';
import { pickOneHttpMethod, pickSetOfHttpMethods, randomPath } from './utils';

const chance = new Chance();

function createResource(method: string, path: string, servers: IServer[]): IHttpOperation {
  return {
    id: chance.guid(),
    method,
    path,
    responses: [{ code: '200' }],
    servers,
    security: [],
    request: { path: [], query: [], cookie: [], headers: [] },
  };
}

describe('http router', () => {
  describe('route()', () => {
    test('should not match if no server defined', () => {
      const method = pickOneHttpMethod();
      const path = randomPath();

      assertLeft(
        router.route({
          resources: [createResource(method, path, [])],
          input: {
            method,
            url: {
              baseUrl: 'http://some.url/',
              path,
            },
          },
        }),
        error => expect(error).toEqual(ProblemJsonError.fromTemplate(NO_SERVER_CONFIGURATION_PROVIDED_ERROR)),
      );
    });

    test('should not match if no resources given', () => {
      assertLeft(
        router.route({
          resources: [],
          input: {
            method: pickOneHttpMethod(),
            url: {
              baseUrl: '',
              path: '',
            },
          },
        }),
        error => expect(error).toEqual(ProblemJsonError.fromTemplate(NO_RESOURCE_PROVIDED_ERROR)),
      );
    });

    describe('given a resource', () => {
      test('should match even if no server defined', () => {
        const method = pickOneHttpMethod();
        const path = randomPath();

        return expect(
          router
            .route({
              resources: [createResource(method, path, [])],
              input: {
                method,
                url: {
                  baseUrl: '',
                  path,
                },
              },
            })
            .isRight(),
        ).toBeTruthy();
      });

      test('given a concrete matching server and unmatched methods should not match', () => {
        const url = chance.url();
        const [resourceMethod, requestMethod] = pickSetOfHttpMethods(2);

        assertLeft(
          router.route({
            resources: [
              createResource(resourceMethod, randomPath(), [
                {
                  url,
                },
              ]),
            ],
            input: {
              method: requestMethod,
              url: {
                baseUrl: url,
                path: '/',
              },
            },
          }),
          error => expect(error).toEqual(ProblemJsonError.fromTemplate(NO_PATH_MATCHED_ERROR)),
        );
      });

      describe('given matched methods', () => {
        const method = pickOneHttpMethod();

        test('given a concrete matching server unmatched path should not match', () => {
          const url = chance.url();
          const path = randomPath({ trailingSlash: false });

          assertLeft(
            router.route({
              resources: [
                createResource(method, path, [
                  {
                    url,
                  },
                ]),
              ],
              input: {
                method,
                url: {
                  baseUrl: url,
                  path: `${path}${randomPath()}`,
                },
              },
            }),
            error => expect(error).toEqual(ProblemJsonError.fromTemplate(NO_PATH_MATCHED_ERROR)),
          );
        });

        test('given a concrete matching server and matched concrete path should match', async () => {
          const url = chance.url();
          const path = randomPath({ includeTemplates: false });
          const expectedResource = createResource(method, path, [
            {
              url,
            },
          ]);
          assertRight(
            router.route({
              resources: [expectedResource],
              input: {
                method,
                url: {
                  baseUrl: url,
                  path,
                },
              },
            }),
            resource => expect(resource).toBe(expectedResource),
          );
        });

        test(`given two resources with different servers
              when routing to third server
              with path matching of one of the resources
              throws an error`, () => {
          assertLeft(
            router.route({
              resources: [
                createResource(method, '/pet', [{ url: 'http://example.com/api' }]),
                createResource(method, '/owner', [{ url: 'http://stg.example.com/api/v2' }]),
              ],
              input: {
                method,
                url: {
                  baseUrl: 'http://oopsy.com',
                  path: '/owner',
                },
              },
            }),
            error => expect(error).toEqual(ProblemJsonError.fromTemplate(NO_SERVER_MATCHED_ERROR)),
          );
        });

        test('given a templated matching server and matched concrete path should match', async () => {
          const url = 'http://{host}/v1';
          const path = randomPath({ includeTemplates: false });
          const expectedResource = createResource(method, path, [
            {
              url,
              variables: {
                host: {
                  default: 'stoplight.io',
                },
              },
            },
          ]);

          assertRight(
            router.route({
              resources: [expectedResource],
              input: {
                method,
                url: {
                  baseUrl: 'http://stoplight.io/v1',
                  path,
                },
              },
            }),
            resource => expect(resource).toBe(expectedResource),
          );
        });

        test('given a templated matching server and matched templated path should match', async () => {
          const url = 'http://{host}/v1';
          const path = '/{x}/b';
          const expectedResource = createResource(method, path, [
            {
              url,
              variables: {
                host: {
                  default: 'stoplight.io',
                },
              },
            },
          ]);

          assertRight(
            router.route({
              resources: [expectedResource],
              input: {
                method,
                url: {
                  baseUrl: 'http://stoplight.io/v1',
                  path: '/a/b',
                },
              },
            }),
            resource => expect(resource).toBe(expectedResource),
          );
        });

        test('given a concrete matching server and matched templated path should match', async () => {
          const url = chance.url();
          const templatedPath = '/a/{b}/c';
          const requestPath = '/a/x/c';
          const expectedResource = createResource(method, templatedPath, [
            {
              url,
            },
          ]);

          assertRight(
            router.route({
              resources: [expectedResource],
              input: {
                method,
                url: {
                  baseUrl: url,
                  path: requestPath,
                },
              },
            }),
            resource => expect(resource).toBe(expectedResource),
          );
        });

        test('given a concrete matching server and unmatched templated path should not match', () => {
          const url = chance.url();
          const templatedPath = '/a/{x}/c';
          const requestPath = '/a/y/b';
          const expectedResource = createResource(method, templatedPath, [
            {
              url,
            },
          ]);

          assertLeft(
            router.route({
              resources: [expectedResource],
              input: {
                method,
                url: {
                  baseUrl: url,
                  path: requestPath,
                },
              },
            }),
            error => expect(error).toEqual(ProblemJsonError.fromTemplate(NO_PATH_MATCHED_ERROR)),
          );
        });

        test('given a concrete servers and mixed paths should match concrete path', async () => {
          const templatedPath = '/{x}/y';
          const concretePath = '/a/y';
          const url = 'concrete.com';
          const resourceWithConcretePath = createResource(method, concretePath, [{ url }]);
          const resourceWithTemplatedPath = createResource(method, templatedPath, [{ url }]);

          assertRight(
            router.route({
              resources: [resourceWithTemplatedPath, resourceWithConcretePath],
              input: {
                method,
                url: {
                  baseUrl: url,
                  path: concretePath,
                },
              },
            }),
            resource => expect(resource).toBe(resourceWithConcretePath),
          );
        });

        test('given a concrete servers and templated paths should match first resource', async () => {
          const templatedPathA = '/{x}/y';
          const templatedPathB = '/a/{z}';
          const url = 'concrete.com';
          const firstResource = createResource(method, templatedPathA, [{ url }]);
          const secondResource = createResource(method, templatedPathB, [{ url }]);

          assertRight(
            router.route({
              resources: [firstResource, secondResource],
              input: {
                method,
                url: {
                  baseUrl: url,
                  path: '/a/y',
                },
              },
            }),
            resource => expect(resource).toBe(firstResource),
          );
        });

        test('given a concrete server and templated server should match concrete', async () => {
          const path = '/';
          const url = 'concrete.com';
          const resourceWithConcreteMatch = createResource(method, path, [
            { url },
            { url: '{template}', variables: { template: { default: url, enum: [url] } } },
          ]);

          const resourceWithTemplatedMatch = createResource(method, path, [
            { url: '{template}', variables: { template: { default: url, enum: [url] } } },
          ]);

          assertRight(
            router.route({
              resources: [resourceWithConcreteMatch, resourceWithTemplatedMatch],
              input: {
                method,
                url: {
                  baseUrl: url,
                  path,
                },
              },
            }),
            resource => expect(resource).toBe(resourceWithConcreteMatch),
          );
        });

        test('given concrete servers should match by path', async () => {
          const matchingPath = '/a/b/c';
          const nonMatchingPath = '/a/b/c/d';
          const url = 'concrete.com';
          const resourceWithMatchingPath = createResource(method, matchingPath, [{ url }]);
          const resourceWithNonMatchingPath = createResource(method, nonMatchingPath, [{ url }]);

          assertRight(
            router.route({
              resources: [resourceWithNonMatchingPath, resourceWithMatchingPath],
              input: {
                method,
                url: {
                  baseUrl: url,
                  path: matchingPath,
                },
              },
            }),
            resource => expect(resource).toBe(resourceWithMatchingPath),
          );
        });

        test('given empty baseUrl and concrete server it should match', () => {
          const path = randomPath({ includeTemplates: false });
          const url = 'concrete.com';
          const expectedResource = createResource(method, path, [{ url }]);

          assertRight(
            router.route({
              resources: [expectedResource],
              input: {
                method,
                url: {
                  baseUrl: '',
                  path,
                },
              },
            }),
            resource => expect(resource).toBe(expectedResource),
          );
        });

        test('given baseUrl and concrete server and non-existing request baseUrl it should not match', () => {
          const path = randomPath({ includeTemplates: false });
          const url = 'concrete.com';

          assertLeft(
            router.route({
              resources: [createResource(method, path, [{ url }])],
              input: {
                method,
                url: {
                  baseUrl: 'solid.com',
                  path,
                },
              },
            }),
            error => expect(error).toEqual(ProblemJsonError.fromTemplate(NO_SERVER_MATCHED_ERROR)),
          );
        });

        test('given empty baseUrl and empty server url it should match', async () => {
          const path = randomPath({ includeTemplates: false });
          const url = '';
          const expectedResource = createResource(method, path, [{ url }]);

          assertRight(
            router.route({
              resources: [expectedResource],
              input: {
                method,
                url: {
                  baseUrl: '',
                  path,
                },
              },
            }),
            resource => expect(resource).toBe(expectedResource),
          );
        });

        test('given no baseUrl and a server url it should ignore servers and match by path', async () => {
          const path = randomPath({ includeTemplates: false });
          const expectedResource = createResource(method, path, [{ url: 'www.stoplight.io/v1' }]);

          assertRight(
            router.route({
              resources: [expectedResource],
              input: {
                method,
                url: {
                  path,
                },
              },
            }),
            resource => expect(resource).toBe(expectedResource),
          );
        });
      });

      test('should not match when the method does not exist', () => {
        const method: IHttpMethod = 'get';
        const path = randomPath({ includeTemplates: false });
        const url = 'concrete.com';

        assertLeft(
          router.route({
            resources: [createResource(method, path, [{ url }])],
            input: {
              method: 'post',
              url: {
                baseUrl: url,
                path,
              },
            },
          }),
          error => expect(error).toEqual(ProblemJsonError.fromTemplate(NO_METHOD_MATCHED_ERROR)),
        );
      });
    });
  });
});
