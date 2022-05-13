import { convertTemplateToRegExp, matchBaseUrl } from '../matchBaseUrl';
import { MatchType } from '../types';
import { assertRight, assertLeft } from '@stoplight/prism-core/src/__tests__/utils';
import * as faker from '@faker-js/faker/locale/en';

describe('matchServer.ts', () => {
  describe('matchServer()', () => {
    test('concrete server url fully matches request url', () => {
      const serverMatch = matchBaseUrl(
        {
          id: faker.random.word(),
          url: 'http://www.example.com/',
        },
        'http://www.example.com/'
      );

      assertRight(serverMatch, result => expect(result).toBe(MatchType.CONCRETE));
    });

    test('concrete server url does not match request url', () => {
      assertRight(
        matchBaseUrl({ id: faker.random.word(), url: 'http://www.example.com' }, 'http://www.example.com/'),
        result => expect(result).toBe(MatchType.NOMATCH)
      );

      assertRight(
        matchBaseUrl({ id: faker.random.word(), url: 'http://www.example.com' }, 'http://www.example'),
        result => expect(result).toBe(MatchType.NOMATCH)
      );

      assertRight(
        matchBaseUrl({ id: faker.random.word(), url: 'http://www.example.com' }, 'http://www.google.com/'),
        result => expect(result).toBe(MatchType.NOMATCH)
      );

      assertRight(
        matchBaseUrl({ id: faker.random.word(), url: 'http://www.example.com:8081/v1' }, 'http://www.example.com/v1'),
        result => expect(result).toBe(MatchType.NOMATCH)
      );
    });

    test('entirely templated server url to match request from enum', () => {
      const serverConfig = {
        id: faker.random.word(),
        url: '{url}',
        variables: {
          url: {
            default: 'http://www.example.com',
            enum: ['http://www.example.com', 'http://www.example.com:8080'],
          },
        },
      };

      assertRight(matchBaseUrl(serverConfig, 'http://www.example.com'), result =>
        expect(result).toBe(MatchType.TEMPLATED)
      );
      assertRight(matchBaseUrl(serverConfig, 'http://www.example.com:8080'), result =>
        expect(result).toBe(MatchType.TEMPLATED)
      );
      assertRight(matchBaseUrl(serverConfig, 'http://www.example.com:808'), result =>
        expect(result).toBe(MatchType.NOMATCH)
      );
      assertRight(matchBaseUrl(serverConfig, 'http://www.example.com:80801'), result =>
        expect(result).toBe(MatchType.NOMATCH)
      );
    });

    test('server url with templated wildcard host to match request url', () => {
      assertRight(
        matchBaseUrl(
          {
            id: faker.random.word(),
            url: 'http://{host}/v1',
            variables: {
              host: { default: 'www.example.com' },
            },
          },
          'http://stoplight.io/v1'
        ),
        result => expect(result).toBe(MatchType.TEMPLATED)
      );
    });

    test('server url with templated enum host to match request url', () => {
      const serverConfig = {
        id: faker.random.word(),
        url: 'http://{host}/v1',
        variables: {
          host: {
            default: 'www.example.com',
            enum: ['stoplight.io', 'google.io'],
          },
        },
      };

      assertRight(matchBaseUrl(serverConfig, 'http://stoplight.io/v1'), result =>
        expect(result).toBe(MatchType.TEMPLATED)
      );
      assertRight(matchBaseUrl(serverConfig, 'http://google.io/v1'), result =>
        expect(result).toBe(MatchType.TEMPLATED)
      );
      assertRight(matchBaseUrl(serverConfig, 'http://bummers.io/v1'), result => expect(result).toBe(MatchType.NOMATCH));
    });

    describe('a complex server template should match request url', () => {
      const serverConfig = {
        id: faker.random.word(),
        url: '{protocol}://{username}@{host}/{path}',
        variables: {
          protocol: {
            default: 'https',
            enum: ['http', 'https'],
          },
          username: {
            default: 'marc',
            enum: ['marc', 'chris'],
          },
          host: {
            default: 'stoplight.io',
            enum: ['stoplight.io', 'stoplight.io:80'],
          },
          path: {
            default: 'v1',
            enum: ['v1', 'v2'],
          },
        },
      };

      function toMatchTemplate(requestBaseUrl: string) {
        assertRight(matchBaseUrl(serverConfig, requestBaseUrl), result => expect(result).toBe(MatchType.TEMPLATED));
      }

      function notToMatchTemplate(requestBaseUrl: string) {
        assertRight(matchBaseUrl(serverConfig, requestBaseUrl), result => expect(result).toBe(MatchType.NOMATCH));
      }

      test('should match variants of enums', () => {
        toMatchTemplate('http://marc@stoplight.io/v1');
        toMatchTemplate('http://marc@stoplight.io/v2');

        toMatchTemplate('http://chris@stoplight.io:80/v1');
        toMatchTemplate('http://marc@stoplight.io:80/v2');

        toMatchTemplate('http://chris@stoplight.io:80/v1');
        toMatchTemplate('http://chris@stoplight.io/v2');

        toMatchTemplate('https://chris@stoplight.io/v1');
        toMatchTemplate('https://chris@stoplight.io/v2');
      });

      test('should not match invalid variants', () => {
        notToMatchTemplate('stopligh.io');
        notToMatchTemplate('http://stopligh.io');
        notToMatchTemplate('http://stopligh.io/v3');
        notToMatchTemplate('http://adam@stopligh.io/v1');
        notToMatchTemplate('http://example.io/v1');
      });
    });
  });

  describe('convertTemplateToRegExp()', () => {
    test('given no variables should resolve to the original string', () => {
      const regexp = convertTemplateToRegExp('{a}');
      assertRight(regexp, result => expect(result).toEqual(/^{a}$/));
    });

    test('given no a variable with enums should alternate these enums', () => {
      const regexp = convertTemplateToRegExp('{a}', {
        a: {
          default: 'z',
          enum: ['y', 'z'],
        },
      });
      assertRight(regexp, result => expect(result).toEqual(/^(y|z)$/));
    });

    test('single variable should resolve a single group regexp', () => {
      const regexp = convertTemplateToRegExp('{a}', {
        a: {
          default: 'va',
        },
      });

      assertRight(regexp, result => expect(result).toEqual(/^(.*?)$/));
    });

    test('given single variable and no matching variable should return Left', () => {
      assertLeft(
        convertTemplateToRegExp('{a}', {
          b: {
            default: 'vb',
          },
        }),
        e => expect(e).toHaveProperty('message', `Variable 'a' is not defined, cannot parse input.`)
      );
    });

    test('given two variables should return multi group', () => {
      const regexp = convertTemplateToRegExp('{a}{b}', {
        a: {
          default: 'va',
        },
        b: {
          default: 'vb2',
          enum: ['vb2'],
        },
      });

      assertRight(regexp, result => expect(result).toEqual(/^(.*?)(vb2)$/));
    });

    test('given a URL should return a pattern', () => {
      const regexp = convertTemplateToRegExp('{protocol}://www.example.com:{port}/{path}', {
        protocol: {
          default: 'http',
          enum: ['http', 'https'],
        },
        port: {
          default: '8080',
        },
        path: {
          default: 'v1',
          enum: ['v1', 'v2'],
        },
      });

      assertRight(regexp, result => expect(result).toEqual(/^(https|http):\/\/www.example.com:(.*?)\/(v1|v2)$/));
    });

    test('given a similar enums should put longer ones first', () => {
      const regexp = convertTemplateToRegExp('{url}', {
        url: {
          default: 'http://example.com',
          enum: ['http://example.com', 'http://example.com:8080'],
        },
      });

      assertRight(regexp, result => expect(result).toEqual(/^(http:\/\/example.com:8080|http:\/\/example.com)$/));
    });
  });
});
