import { HttpParamStyles } from '@stoplight/types';
import { createExamplePath } from '../paths';
import { assertRight, assertLeft } from '@stoplight/prism-core/src/__tests__/utils';
import * as faker from 'faker/locale/en';

describe('createExamplePath()', () => {
  describe('path parameters', () => {
    it('generates simple style', () => {
      assertRight(
        createExamplePath({
          id: '123',
          path: '/path/{p}',
          method: 'get',
          request: {
            path: [
              {
                id: faker.random.word(),
                name: 'p',
                style: HttpParamStyles.Simple,
                examples: [{ id: faker.random.word(), key: 'foo', value: 'test' }],
              },
            ],
          },
          responses: [{ id: faker.random.word(), code: '200' }],
        }),
        r => expect(r).toEqual('/path/test')
      );
    });

    it('generates simple style with hyphens', () => {
      assertRight(
        createExamplePath({
          id: '123',
          path: '/path-path/{p-id}',
          method: 'get',
          request: {
            path: [
              {
                id: faker.random.word(),
                name: 'p-id',
                style: HttpParamStyles.Simple,
                examples: [{ id: faker.random.word(), key: 'foo', value: 'test' }],
              },
            ],
          },
          responses: [{ id: faker.random.word(), code: '200' }],
        }),
        r => expect(r).toEqual('/path-path/test')
      );
    });

    it('generates label style', () => {
      assertRight(
        createExamplePath({
          id: '123',
          path: '/path/{p}',
          method: 'get',
          request: {
            path: [
              {
                id: faker.random.word(),
                name: 'p',
                style: HttpParamStyles.Label,
                examples: [{ id: faker.random.word(), key: 'foo', value: 'test' }],
              },
            ],
          },
          responses: [{ id: faker.random.word(), code: '200' }],
        }),
        r => expect(r).toEqual('/path/.test')
      );
    });

    it('generates label style with hyphens', () => {
      assertRight(
        createExamplePath({
          id: '123',
          path: '/path-path/{p-id}',
          method: 'get',
          request: {
            path: [
              {
                id: faker.random.word(),
                name: 'p-id',
                style: HttpParamStyles.Label,
                examples: [{ id: faker.random.word(), key: 'foo', value: 'test' }],
              },
            ],
          },
          responses: [{ id: faker.random.word(), code: '200' }],
        }),
        r => expect(r).toEqual('/path-path/.test')
      );
    });

    it('generates matrix style', () => {
      assertRight(
        createExamplePath({
          id: '123',
          path: '/path/{p}',
          method: 'get',
          request: {
            path: [
              {
                id: faker.random.word(),
                name: 'p',
                style: HttpParamStyles.Matrix,
                examples: [{ id: faker.random.word(), key: 'foo', value: 'test' }],
              },
            ],
          },
          responses: [{ id: faker.random.word(), code: '200' }],
        }),
        r => expect(r).toEqual('/path/;p=test')
      );
    });

    it('generates matrix style with hyphens', () => {
      assertRight(
        createExamplePath({
          id: '123',
          path: '/path-path/{p-a}',
          method: 'get',
          request: {
            path: [
              {
                id: faker.random.word(),
                name: 'p-a',
                style: HttpParamStyles.Matrix,
                examples: [{ id: faker.random.word(), key: 'foo', value: 'test' }],
              },
            ],
          },
          responses: [{ id: faker.random.word(), code: '200' }],
        }),
        r => expect(r).toEqual('/path-path/;p-a=test')
      );
    });
  });

  describe('query parameters', () => {
    it('generates form style', () => {
      assertRight(
        createExamplePath({
          id: '123',
          path: '/path',
          method: 'get',
          request: {
            query: [
              {
                id: faker.random.word(),
                name: 'p',
                style: HttpParamStyles.Form,
                examples: [{ id: faker.random.word(), key: 'foo', value: 'test' }],
              },
            ],
          },
          responses: [{ id: faker.random.word(), code: '200' }],
        }),
        r => expect(r).toEqual('/path?p=test')
      );
    });

    it('generates form style with hyphens', () => {
      assertRight(
        createExamplePath({
          id: '123',
          path: '/path-path',
          method: 'get',
          request: {
            query: [
              {
                id: faker.random.word(),
                name: 'p-a',
                style: HttpParamStyles.Form,
                examples: [{ id: faker.random.word(), key: 'foo', value: 'test' }],
              },
            ],
          },
          responses: [{ id: faker.random.word(), code: '200' }],
        }),
        r => expect(r).toEqual('/path-path?p-a=test')
      );
    });

    it('generates deepObject style', () => {
      assertRight(
        createExamplePath({
          id: '123',
          path: '/path',
          method: 'get',
          request: {
            query: [
              {
                id: faker.random.word(),
                name: 'p',
                style: HttpParamStyles.DeepObject,
                examples: [{ id: faker.random.word(), key: 'foo', value: { a: { aa: 1, ab: 2 } } }],
              },
            ],
          },
          responses: [{ id: faker.random.word(), code: '200' }],
        }),
        r => expect(r).toEqual('/path?p%5Ba%5D%5Baa%5D=1&p%5Ba%5D%5Bab%5D=2')
      );
    });

    it('generates deepObject style with hyphens', () => {
      assertRight(
        createExamplePath({
          id: '123',
          path: '/path-path',
          method: 'get',
          request: {
            query: [
              {
                id: faker.random.word(),
                name: 'p-id',
                style: HttpParamStyles.DeepObject,
                examples: [{ id: faker.random.word(), key: 'foo', value: { a: { aa: 1, ab: 2 } } }],
              },
            ],
          },
          responses: [{ id: faker.random.word(), code: '200' }],
        }),
        r => expect(r).toEqual('/path-path?p-id%5Ba%5D%5Baa%5D=1&p-id%5Ba%5D%5Bab%5D=2')
      );
    });

    it('generates pipeDelimited style', () => {
      assertRight(
        createExamplePath({
          id: '123',
          path: '/path',
          method: 'get',
          request: {
            query: [
              {
                id: faker.random.word(),
                name: 'p',
                style: HttpParamStyles.PipeDelimited,
                examples: [{ id: faker.random.word(), key: 'foo', value: [1, 2, 3] }],
              },
            ],
          },
          responses: [{ id: faker.random.word(), code: '200' }],
        }),
        r => expect(r).toEqual('/path?p=1%7C2%7C3')
      );
    });

    it('generates pipeDelimited style with hyphens', () => {
      assertRight(
        createExamplePath({
          id: '123',
          path: '/path-path',
          method: 'get',
          request: {
            query: [
              {
                id: faker.random.word(),
                name: 'p-id',
                style: HttpParamStyles.PipeDelimited,
                examples: [{ id: faker.random.word(), key: 'foo', value: [1, 2, 3] }],
              },
            ],
          },
          responses: [{ id: faker.random.word(), code: '200' }],
        }),
        r => expect(r).toEqual('/path-path?p-id=1%7C2%7C3')
      );
    });

    it('generates spaceDelimited style', () => {
      assertRight(
        createExamplePath({
          id: '123',
          path: '/path',
          method: 'get',
          request: {
            query: [
              {
                id: faker.random.word(),
                name: 'p',
                style: HttpParamStyles.SpaceDelimited,
                examples: [{ id: faker.random.word(), key: 'foo', value: [1, 2, 3] }],
              },
            ],
          },
          responses: [{ id: faker.random.word(), code: '200' }],
        }),
        r => expect(r).toEqual('/path?p=1%202%203')
      );
    });

    it('generates spaceDelimited style with hyphens', () => {
      assertRight(
        createExamplePath({
          id: '123',
          path: '/path-path',
          method: 'get',
          request: {
            query: [
              {
                id: faker.random.word(),
                name: 'p-id',
                style: HttpParamStyles.SpaceDelimited,
                examples: [{ id: faker.random.word(), key: 'foo', value: [1, 2, 3] }],
              },
            ],
          },
          responses: [{ id: faker.random.word(), code: '200' }],
        }),
        r => expect(r).toEqual('/path-path?p-id=1%202%203')
      );
    });

    it('fails when invalid example provided for pipeDelimited style', () => {
      assertLeft(
        createExamplePath({
          id: '123',
          path: '/path',
          method: 'get',
          request: {
            query: [
              {
                id: faker.random.word(),
                name: 'q',
                style: HttpParamStyles.PipeDelimited,
                examples: [{ id: faker.random.word(), key: 'foo', value: 'test' }],
              },
            ],
          },
          responses: [{ id: faker.random.word(), code: '200' }],
        }),
        e => expect(e.message).toEqual('Pipe delimited style is only applicable to array parameter')
      );
    });

    it('fails when invalid example provided for spaceDelimited style', () => {
      assertLeft(
        createExamplePath({
          id: '123',
          path: '/path',
          method: 'get',
          request: {
            query: [
              {
                id: faker.random.word(),
                name: 'q',
                style: HttpParamStyles.SpaceDelimited,
                examples: [{ id: faker.random.word(), key: 'foo', value: 'test' }],
              },
            ],
          },
          responses: [{ id: faker.random.word(), code: '200' }],
        }),
        e => expect(e.message).toEqual('Space delimited style is only applicable to array parameter')
      );
    });

    it('encodes params with special characters', () => {
      assertRight(
        createExamplePath({
          id: '123',
          path: '/path',
          method: 'get',
          request: {
            query: [
              {
                id: faker.random.word(),
                name: 'StartTime>',
                style: HttpParamStyles.Form,
                examples: [{ id: faker.random.word(), key: 'foo', value: '1985-10-25T03:33:00.613Z' }],
              },
            ],
          },
          responses: [{ id: faker.random.word(), code: '200' }],
        }),
        r => expect(r).toEqual('/path?StartTime%3E=1985-10-25T03%3A33%3A00.613Z')
      );
    });
  });

  describe('mixed parameters', () => {
    it('generates correct path', () => {
      assertRight(
        createExamplePath({
          id: '123',
          path: '/path/{p1}/{p2}/{p3}',
          method: 'get',
          request: {
            path: [
              {
                id: faker.random.word(),
                name: 'p1',
                style: HttpParamStyles.Simple,
                examples: [{ id: faker.random.word(), key: 'foo', value: 'test1' }],
              },
              {
                id: faker.random.word(),
                name: 'p2',
                style: HttpParamStyles.Label,
                examples: [{ id: faker.random.word(), key: 'foo', value: ['test1', 'test2'] }],
              },
              {
                id: faker.random.word(),
                name: 'p3',
                style: HttpParamStyles.Matrix,
                examples: [{ id: faker.random.word(), key: 'foo', value: ['test1', 'test2'] }],
              },
            ],
            query: [
              {
                id: faker.random.word(),
                name: 'q1',
                style: HttpParamStyles.Form,
                examples: [{ id: faker.random.word(), key: 'foo', value: 'test1' }],
              },
              {
                id: faker.random.word(),
                name: 'q2',
                style: HttpParamStyles.SpaceDelimited,
                examples: [{ id: faker.random.word(), key: 'foo', value: ['test1', 'test2'] }],
              },
              {
                id: faker.random.word(),
                name: 'q3',
                style: HttpParamStyles.PipeDelimited,
                examples: [{ id: faker.random.word(), key: 'foo', value: ['test1', 'test2'] }],
              },
              {
                id: faker.random.word(),
                name: 'q4',
                style: HttpParamStyles.PipeDelimited,
                explode: true,
                examples: [{ id: faker.random.word(), key: 'foo', value: ['test1', 'test2'] }],
              },
              {
                id: faker.random.word(),
                name: 'q5',
                style: HttpParamStyles.DeepObject,
                examples: [
                  { id: faker.random.word(), key: 'foo', value: { a: ['test1', 'test2'], b: { ba: 1, bb: 2 } } },
                ],
              },
            ],
          },
          responses: [{ id: faker.random.word(), code: '200' }],
        }),
        r =>
          expect(r).toEqual(
            '/path/test1/.test1,test2/;p3=test1,test2?q1=test1&q2=test1%20test2&q3=test1%7Ctest2&q4=test1&q4=test2&q5%5Ba%5D%5B%5D=test1&q5%5Ba%5D%5B%5D=test2&q5%5Bb%5D%5Bba%5D=1&q5%5Bb%5D%5Bbb%5D=2'
          )
      );
    });
  });
});
