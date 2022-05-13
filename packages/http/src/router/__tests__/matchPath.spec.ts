import { matchPath } from '../matchPath';
import faker from '@faker-js/faker';
import { MatchType } from '../types';
import { randomPath } from './utils';
import { assertRight } from '@stoplight/prism-core/src/__tests__/utils';

describe('matchPath()', () => {
  test('root path should match another root path', () => {
    const path = '/';
    assertRight(matchPath(path, path), e => expect(e).toEqual(MatchType.CONCRETE));
  });

  test('any concrete path with spaces should match an equal concrete path', () => {
    // e.g. /a b/c should match /a b/c
    const path = randomPath({
      pathFragments: faker.datatype.number({ min: 2, max: 6 }),
      includeTemplates: false,
      includeSpaces: true,
    });

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

  test('any concrete path with colon should match an equal concrete path', () => {
    // e.g. /a/b:c should match /a/b:c
    const path = randomPath({
      pathFragments: faker.datatype.number({ min: 2, max: 6 }),
      includeTemplates: false,
      includeColon: true,
    });
    assertRight(matchPath(path, path), e => expect(e).toEqual(MatchType.CONCRETE));
  });

  // This test will likely never fail because strings are always different
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

  test('none request path with colons should match path with less fragments', () => {
    // e.g. /a/b:c should not match /a/b
    // e.g. /a/b:c should not match /{a}/b
    const requestPath = randomPath({
      pathFragments: faker.datatype.number({ min: 5, max: 7 }),
      includeTemplates: false,
      includeColon: true,
    });
    const operationPath = requestPath.split(':').shift() + '';
    assertRight(matchPath(requestPath, operationPath), e => expect(e).toEqual(MatchType.NOMATCH));
  });

  test('none request path with a colon should not match equivalent slash path', () => {
    // e.g. /a/b:c should not match /a/b/c
    const requestPath = randomPath({
      pathFragments: faker.datatype.number({ min: 5, max: 7 }),
      includeTemplates: false,
      includeColon: true,
    });
    const operationPath = requestPath.replace(':', '/');
    assertRight(matchPath(requestPath, operationPath), e => expect(e).toEqual(MatchType.NOMATCH));
  });

  // This test will likely never fail because strings are always different
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

  test('none request path with colons should match path with more fragments', () => {
    // e.g. /a/b:c should not match /a/b/c:d
    // e.g. /a/b:c should not match /{a}/b/c:d
    const requestPath = randomPath({
      pathFragments: faker.datatype.number({ min: 5, max: 7 }),
      includeTemplates: false,
      includeColon: true,
    });
    const newPath = requestPath.split(':').shift();
    const lastWord = requestPath.split(':').pop();
    const operationPath = [newPath, '/', lastWord, ':', faker.random.word()].join('');

    assertRight(matchPath(requestPath, operationPath), e => expect(e).toEqual(MatchType.NOMATCH));
  });

  test('request path should match a templated path and resolve variables', () => {
    assertRight(matchPath('/a', '/{a}'), e => expect(e).toEqual(MatchType.TEMPLATED));

    assertRight(matchPath('/a:b', '/{a}:b'), e => expect(e).toEqual(MatchType.TEMPLATED));

    assertRight(matchPath('/a/b', '/{a}/{b}'), e => expect(e).toEqual(MatchType.TEMPLATED));

    assertRight(matchPath('/a/b:c', '/{a}/{b}:{c}'), e => expect(e).toEqual(MatchType.TEMPLATED));

    assertRight(matchPath('/a/b', '/a/{b}'), e => expect(e).toEqual(MatchType.TEMPLATED));

    assertRight(matchPath('/a/b:c', '/a/b:{c}'), e => expect(e).toEqual(MatchType.TEMPLATED));

    assertRight(matchPath('/test.json', '/test.{format}'), e => expect(e).toEqual(MatchType.TEMPLATED));
  });

  test('request path should match a template path and resolve undefined variables', () => {
    assertRight(matchPath('/', '/{a}'), e => expect(e).toEqual(MatchType.TEMPLATED));

    assertRight(matchPath('/:', '/{a}:{b}'), e => expect(e).toEqual(MatchType.TEMPLATED));

    assertRight(matchPath('//', '/{a}/'), e => expect(e).toEqual(MatchType.TEMPLATED));

    assertRight(matchPath('//b', '/{a}/{b}'), e => expect(e).toEqual(MatchType.TEMPLATED));

    assertRight(matchPath('//b:c', '/{a}/{b}:{c}'), e => expect(e).toEqual(MatchType.TEMPLATED));

    assertRight(matchPath('/a/', '/{a}/{b}'), e => expect(e).toEqual(MatchType.TEMPLATED));

    assertRight(matchPath('//', '/{a}/{b}'), e => expect(e).toEqual(MatchType.TEMPLATED));
  });

  // This test will likely never fail because strings are always different
  test('none path should match templated operation with more path fragments (dynamic)', () => {
    // e.g. `/a/b` should not match /{x}/{y}/{z}
    // e.g. `/a` should not match /{x}/{y}/{z}
    const requestPath = randomPath({
      pathFragments: faker.datatype.number({ min: 1, max: 3 }),
      includeTemplates: false,
      trailingSlash: false,
    });

    const operationPath = randomPath({
      pathFragments: faker.datatype.number({ min: 4, max: 6 }),
      includeTemplates: true,
      trailingSlash: false,
    });

    assertRight(matchPath(requestPath, operationPath), e => expect(e).toEqual(MatchType.NOMATCH));
  });

  test('none path should match templated operation with more path fragments', () => {
    const requestPath = '/a/b/c';
    const operationPath = '/{d}/{e}/{f}/{g}';

    assertRight(matchPath(requestPath, operationPath), e => expect(e).toEqual(MatchType.NOMATCH));
  });

  test('it does not match if separators are not equal', () => {
    assertRight(matchPath('/a:b/c', '/a/b:c'), e => expect(e).toEqual(MatchType.NOMATCH));
  });

  test('it accepts columns as part of templated params', () => {
    assertRight(matchPath('/a:b/c', '/{something}/c'), e => expect(e).toEqual(MatchType.TEMPLATED));
  });

  test('it properly processes fragments containing both concrete and templated parts', () => {
    assertRight(matchPath('/a', '/a.{json}'), e => expect(e).toEqual(MatchType.NOMATCH));
    assertRight(matchPath('/test.json', '/test.{format}'), e => expect(e).toEqual(MatchType.TEMPLATED));
    assertRight(matchPath('/test.', '/test.{format}'), e => expect(e).toEqual(MatchType.TEMPLATED));
    assertRight(matchPath('/nope.json', '/test.{format}'), e => expect(e).toEqual(MatchType.NOMATCH));
    assertRight(matchPath('/before/test.json.sub/after', '/{prefix}/test.{format}.{extension}/{suffix}'), e =>
      expect(e).toEqual(MatchType.TEMPLATED)
    );
  });

  test.each([
    '%3A', // column
    '%2F', // forward slash
  ])('parameters can contain encoded "special characters" (%s)', (encoded: string) => {
    const requestPath = `/bef${encoded}17/test.smthg${encoded}32.sub${encoded}47/aft${encoded}96`;

    assertRight(matchPath(requestPath, `/{prefix}/test.{format}.{extension}/{suffix}`), e =>
      expect(e).toEqual(MatchType.TEMPLATED)
    );
    assertRight(matchPath(requestPath, '/{prefix}/test.{global}/{suffix}'), e =>
      expect(e).toEqual(MatchType.TEMPLATED)
    );
  });
});
