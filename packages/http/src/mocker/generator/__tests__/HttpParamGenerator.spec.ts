import { assertNone, assertSome } from '@stoplight/prism-core/src/utils/__tests__/utils';
import { HttpParamStyles } from '@stoplight/types';
import { generate } from '../HttpParamGenerator';

describe('HttpParamGenerator', () => {
  describe('generate()', () => {
    describe('example is present', () => {
      it('uses static example', () => {
        assertSome(generate({ name: 'a', style: HttpParamStyles.Form, examples: [{ key: 'foo', value: 'test' }] }), v =>
          expect(v).toEqual('test'),
        );
      });
    });

    describe('schema and example is present', () => {
      it('prefers static example', () => {
        assertSome(
          generate({
            name: 'a',
            style: HttpParamStyles.Form,
            schema: { type: 'string' },
            examples: [{ key: 'foo', value: 'test' }],
          }),
          v => expect(v).toEqual('test'),
        );
      });
    });

    describe('schema is present', () => {
      it('generates example from schema', () => {
        assertSome(
          generate({
            name: 'a',
            style: HttpParamStyles.Form,
            schema: { type: 'string', format: 'email' },
          }),
          v => expect(v).toEqual(expect.stringMatching(/@/)),
        );
      });
    });

    describe('no schema and no examples', () => {
      it('returns none', () => {
        assertNone(
          generate({
            name: 'a',
            style: HttpParamStyles.Form,
          }),
        );
      });
    });
  });
});
