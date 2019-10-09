import { assertLeft, assertRight } from '@stoplight/prism-http/src/__tests__/utils';
import { HttpParamStyles } from '@stoplight/types';
import { createExamplePath } from '../paths';

describe('createExamplePath()', () => {
  describe('path parameters', () => {
    it('generates simple style', () => {
      assertRight(
        createExamplePath({
          id: '123',
          path: '/path/{p}',
          method: 'get',
          request: { path: [{ name: 'p', style: HttpParamStyles.Simple, examples: [{ key: 'foo', value: 'test' }] }] },
          responses: [{ code: '200' }],
        }),
        r => expect(r).toEqual('/path/test'),
      );
    });

    it('generates label style', () => {
      assertRight(
        createExamplePath({
          id: '123',
          path: '/path/{p}',
          method: 'get',
          request: { path: [{ name: 'p', style: HttpParamStyles.Label, examples: [{ key: 'foo', value: 'test' }] }] },
          responses: [{ code: '200' }],
        }),
        r => expect(r).toEqual('/path/.test'),
      );
    });

    it('generates matrix style', () => {
      assertRight(
        createExamplePath({
          id: '123',
          path: '/path/{p}',
          method: 'get',
          request: { path: [{ name: 'p', style: HttpParamStyles.Matrix, examples: [{ key: 'foo', value: 'test' }] }] },
          responses: [{ code: '200' }],
        }),
        r => expect(r).toEqual('/path/;p=test'),
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
          request: { query: [{ name: 'p', style: HttpParamStyles.Form, examples: [{ key: 'foo', value: 'test' }] }] },
          responses: [{ code: '200' }],
        }),
        r => expect(r).toEqual('/path?p=test'),
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
                name: 'p',
                style: HttpParamStyles.DeepObject,
                examples: [{ key: 'foo', value: { a: { aa: 1, ab: 2 } } }],
              },
            ],
          },
          responses: [{ code: '200' }],
        }),
        r => expect(r).toEqual('/path?p[a][aa]=1&p[a][ab]=2'),
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
                name: 'p',
                style: HttpParamStyles.PipeDelimited,
                examples: [{ key: 'foo', value: [1, 2, 3] }],
              },
            ],
          },
          responses: [{ code: '200' }],
        }),
        r => expect(r).toEqual('/path?p=1%7C2%7C3'),
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
                name: 'p',
                style: HttpParamStyles.SpaceDelimited,
                examples: [{ key: 'foo', value: [1, 2, 3] }],
              },
            ],
          },
          responses: [{ code: '200' }],
        }),
        r => expect(r).toEqual('/path?p=1%202%203'),
      );
    });

    it('fails when invalid example provided for pipeDelimited style', () => {
      assertLeft(
        createExamplePath({
          id: '123',
          path: '/path',
          method: 'get',
          request: {
            query: [{ name: 'q', style: HttpParamStyles.PipeDelimited, examples: [{ key: 'foo', value: 'test' }] }],
          },
          responses: [{ code: '200' }],
        }),
        e => expect(e.message).toEqual('Pipe delimited style is only applicable to array parameter'),
      );
    });

    it('fails when invalid example provided for spaceDelimited style', () => {
      assertLeft(
        createExamplePath({
          id: '123',
          path: '/path',
          method: 'get',
          request: {
            query: [{ name: 'q', style: HttpParamStyles.SpaceDelimited, examples: [{ key: 'foo', value: 'test' }] }],
          },
          responses: [{ code: '200' }],
        }),
        e => expect(e.message).toEqual('Space delimited style is only applicable to array parameter'),
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
              { name: 'p1', style: HttpParamStyles.Simple, examples: [{ key: 'foo', value: 'test1' }] },
              { name: 'p2', style: HttpParamStyles.Label, examples: [{ key: 'foo', value: ['test1', 'test2'] }] },
              { name: 'p3', style: HttpParamStyles.Matrix, examples: [{ key: 'foo', value: ['test1', 'test2'] }] },
            ],
            query: [
              { name: 'q1', style: HttpParamStyles.Form, examples: [{ key: 'foo', value: 'test1' }] },
              {
                name: 'q2',
                style: HttpParamStyles.SpaceDelimited,
                examples: [{ key: 'foo', value: ['test1', 'test2'] }],
              },
              {
                name: 'q3',
                style: HttpParamStyles.PipeDelimited,
                examples: [{ key: 'foo', value: ['test1', 'test2'] }],
              },
              {
                name: 'q4',
                style: HttpParamStyles.PipeDelimited,
                explode: true,
                examples: [{ key: 'foo', value: ['test1', 'test2'] }],
              },
              {
                name: 'q5',
                style: HttpParamStyles.DeepObject,
                examples: [{ key: 'foo', value: { a: ['test1', 'test2'], b: { ba: 1, bb: 2 } } }],
              },
            ],
          },
          responses: [{ code: '200' }],
        }),
        r =>
          expect(r).toEqual(
            '/path/test1/.test1,test2/;p3=test1,test2?q1=test1&q2=test1%20test2&q3=test1%7Ctest2&q4=test1&q4=test2&q5[a][]=test1&q5[a][]=test2&q5[b][ba]=1&q5[b][bb]=2',
          ),
      );
    });
  });
});
