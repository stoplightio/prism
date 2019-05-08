import { Chance } from 'chance';
import { matchPath } from '../matchPath';
import { MatchType } from '../types';
import { randomPath } from './utils';

const chance = new Chance();

describe('matchPath()', () => {
  test('request path must start with a slash or throw error', () => {
    const requestPath = randomPath({ leadingSlash: false });
    const operationPath = randomPath({ leadingSlash: true });
    expect(() => matchPath(requestPath, operationPath)).toThrow(
      `The request path '${requestPath}' must start with a slash.`,
    );
  });

  test('operation path must start with a slash or throw error', () => {
    const requestPath = randomPath({ leadingSlash: true });
    const operationPath = randomPath({ leadingSlash: false });
    expect(() => matchPath(requestPath, operationPath)).toThrow(
      `Given request path '${requestPath}' the operation path '${operationPath}' must start with a slash.`,
    );
  });

  test('root path should match another root path', () => {
    const path = '/';
    expect(matchPath(path, path)).toEqual(MatchType.CONCRETE);
  });

  test('any concrete path should match an equal concrete path', () => {
    // e.g. /a/b/c should match /a/b/c
    const path = randomPath({
      pathFragments: chance.natural({ min: 1, max: 6 }),
      includeTemplates: false,
    });

    expect(matchPath(path, path)).toEqual(MatchType.CONCRETE);
  });

  test('none request path should not match path with less fragments', () => {
    // e.g. /a/b/c should not match /a/b
    // e.g. /a/b/c should not match /{a}/b
    const trailingSlash = chance.bool();
    const requestPath = randomPath({
      pathFragments: chance.natural({ min: 4, max: 6 }),
      includeTemplates: false,
      trailingSlash,
    });
    const operationPath = randomPath({
      pathFragments: chance.natural({ min: 1, max: 3 }),
      trailingSlash,
    });

    expect(matchPath(requestPath, operationPath)).toEqual(MatchType.NOMATCH);
  });

  test('none request path should match concrete path with more fragments', () => {
    // e.g. /a/b should not match /a/b/c
    // e.g. /a/b/ should not match /a/b/c
    const requestPath = randomPath({
      pathFragments: chance.natural({ min: 4, max: 6 }),
      includeTemplates: false,
    });
    const operationPath = randomPath({
      pathFragments: chance.natural({ min: 1, max: 3 }),
      includeTemplates: false,
    });

    expect(matchPath(requestPath, operationPath)).toEqual(MatchType.NOMATCH);
  });

  test('reqest path should match a templated path and resolve variables', () => {
    expect(matchPath('/a', '/{a}')).toEqual(MatchType.TEMPLATED);

    expect(matchPath('/a/b', '/{a}/{b}')).toEqual(MatchType.TEMPLATED);

    expect(matchPath('/a/b', '/a/{b}')).toEqual(MatchType.TEMPLATED);
  });

  test('request path should match a template path and resolve undefined variables', () => {
    expect(matchPath('/', '/{a}')).toEqual(MatchType.TEMPLATED);

    expect(matchPath('//', '/{a}/')).toEqual(MatchType.TEMPLATED);

    expect(matchPath('//b', '/{a}/{b}')).toEqual(MatchType.TEMPLATED);

    expect(matchPath('/a/', '/{a}/{b}')).toEqual(MatchType.TEMPLATED);

    expect(matchPath('//', '/{a}/{b}')).toEqual(MatchType.TEMPLATED);
  });

  test('none path should match templated operation with more path fragments', () => {
    // e.g. `/a/b` should not match /{x}/{y}/{z}
    // e.g. `/a` should not match /{x}/{y}/{z}
    const requestPath = randomPath({
      pathFragments: chance.natural({ min: 1, max: 3 }),
      includeTemplates: false,
      trailingSlash: false,
    });
    const operationPath = randomPath({
      pathFragments: chance.natural({ min: 4, max: 6 }),
      includeTemplates: false,
      trailingSlash: false,
    });

    expect(matchPath(requestPath, operationPath)).toEqual(MatchType.NOMATCH);
  });
});
