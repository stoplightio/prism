import { assertNone, assertSome } from '@stoplight/prism-core/src/__tests__/utils';
import { generate, improveSchema } from '../HttpParamGenerator';

describe('HttpParamGenerator', () => {
  describe('generate()', () => {
    describe('example is present', () => {
      it('uses static example', () => {
        assertSome(generate({ examples: [{ key: 'foo', value: 'test' }] }), v => expect(v).toEqual('test'));
      });
    });

    describe('schema and example is present', () => {
      it('prefers static example', () => {
        assertSome(generate({ schema: { type: 'string' }, examples: [{ key: 'foo', value: 'test' }] }), v =>
          expect(v).toEqual('test')
        );
      });
    });

    describe('schema is present', () => {
      it('generates example from schema', () => {
        assertSome(generate({ schema: { type: 'string', format: 'email' } }), v =>
          expect(v).toEqual(expect.stringMatching(/@/))
        );
      });
    });

    describe('no schema and no examples', () => {
      it('returns none', () => {
        assertNone(generate({}));
      });
    });
  });

  describe('improveSchema()', () => {
    describe.each(['number', 'integer'])('when feed with a %s', type => {
      // @ts-ignore
      const improvedSchema = improveSchema({ type });

      it('should have a minimum and a maximum', () => {
        expect(improvedSchema).toHaveProperty('minimum', 1);
        expect(improvedSchema).toHaveProperty('maximum', 1000);
      });
    });

    describe('when feed with string', () => {
      describe('no format and no enum', () => {
        const improvedSchema = improveSchema({ type: 'string' });

        it('should have the x-faker extension', () => {
          expect(improvedSchema).toHaveProperty('x-faker', 'lorem.word');
        });
      });

      describe.each<[string, object]>([
        ['format', { format: 'email' }],
        ['enum', { enum: [1, 2, 3] }],
        ['pattern', { pattern: '^[A-Z]+$' }],
      ])('when with %s', (_a, additional) => {
        const improvedSchema = improveSchema({ type: 'string', ...additional });

        it('should not have the x-faker extension', () => expect(improvedSchema).not.toHaveProperty('x-faker'));
      });
    });

    describe('when feed with object', () => {
      describe('no format and no enum', () => {
        const improvedSchema = improveSchema({
          type: 'object',
          properties: { a: { type: 'string' }, b: { type: 'number' } },
        });

        it('will recursively improve the schema', () => {
          expect(improvedSchema).toHaveProperty('properties.a.x-faker', 'lorem.word');
          expect(improvedSchema).toHaveProperty('properties.b.minimum', 1);
          expect(improvedSchema).toHaveProperty('properties.b.maximum', 1000);
        });
      });
    });
  });
});
