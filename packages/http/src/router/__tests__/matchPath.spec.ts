import { matchPath } from '../matchPath';
import * as faker from 'faker';
import { MatchType } from '../types';
import { randomPath } from './utils';
import { assertRight } from '@stoplight/prism-core/src/__tests__/utils';

describe('matchPath()', () => {
  test('root path should match another root path', () => {
    const path = '/';
    assertRight(matchPath(path, path), e => expect(e).toEqual(MatchType.CONCRETE));
  });

  test('any concrete path should match an equal concrete path', () => {
    // e.g. /a/b/c should match /a/b/c
    const path = randomPath({
      pathFragments: faker.datatype.number({ min: 1, max: 6 }),
      includeTemplates: false,
    });

    assertRight(matchPath(path, path), e => expect(e).toEqual(MatchType.CONCRETE));
  });

  test('none request path should match path with less fragments', () => {
    // e.g. /a/b/c should not match /a/b
    // e.g. /a/b/c should not match /{a}/b
    const trailingSlash = faker.datatype.boolean();
    const requestPath = randomPath({
      pathFragments: faker.datatype.number({ min: 4, max: 6 }),
      includeTemplates: false,
      trailingSlash,
    });
    const operationPath = randomPath({
      pathFragments: faker.datatype.number({ min: 1, max: 3 }),
      trailingSlash,
    });

    assertRight(matchPath(requestPath, operationPath), e => expect(e).toEqual(MatchType.NOMATCH));
  });

  test('none request path should match concrete path with more fragments', () => {
    // e.g. /a/b should not match /a/b/c
    // e.g. /a/b/ should not match /a/b/c
    const requestPath = randomPath({
      pathFragments: faker.datatype.number({ min: 4, max: 6 }),
      includeTemplates: false,
    });
    const operationPath = randomPath({
      pathFragments: faker.datatype.number({ min: 1, max: 3 }),
      includeTemplates: false,
    });

    assertRight(matchPath(requestPath, operationPath), e => expect(e).toEqual(MatchType.NOMATCH));
  });

  test('request path should match a templated path and resolve variables', () => {
    assertRight(matchPath('/a', '/{a}'), e => expect(e).toEqual(MatchType.TEMPLATED));

    assertRight(matchPath('/a/b', '/{a}/{b}'), e => expect(e).toEqual(MatchType.TEMPLATED));

    assertRight(matchPath('/a/b', '/a/{b}'), e => expect(e).toEqual(MatchType.TEMPLATED));

    assertRight(matchPath('/test.json', '/test.{format}'), e => expect(e).toEqual(MatchType.TEMPLATED));
  });

  test('request path should match a template path and resolve undefined variables', () => {
    assertRight(matchPath('/', '/{a}'), e => expect(e).toEqual(MatchType.TEMPLATED));

    assertRight(matchPath('//', '/{a}/'), e => expect(e).toEqual(MatchType.TEMPLATED));

    assertRight(matchPath('//b', '/{a}/{b}'), e => expect(e).toEqual(MatchType.TEMPLATED));

    assertRight(matchPath('/a/', '/{a}/{b}'), e => expect(e).toEqual(MatchType.TEMPLATED));

    assertRight(matchPath('//', '/{a}/{b}'), e => expect(e).toEqual(MatchType.TEMPLATED));
  });

  test('none path should match templated operation with more path fragments', () => {
    // e.g. `/a/b` should not match /{x}/{y}/{z}
    // e.g. `/a` should not match /{x}/{y}/{z}
    const requestPath = randomPath({
      pathFragments: faker.datatype.number({ min: 1, max: 3 }),
      includeTemplates: false,
      trailingSlash: false,
    });

    const operationPath = randomPath({
      pathFragments: faker.datatype.number({ min: 4, max: 6 }),
      includeTemplates: false,
      trailingSlash: false,
    });

    assertRight(matchPath(requestPath, operationPath), e => expect(e).toEqual(MatchType.NOMATCH));
  });
});
