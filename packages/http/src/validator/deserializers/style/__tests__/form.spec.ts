import { HttpParamStyles } from '@stoplight/types';

import { FormStyleDeserializer } from '../form';
import * as createObjectFromKeyValListModule from '../utils';

describe('FormStyleDeserializer', () => {
  const formStyleDeserializer = new FormStyleDeserializer();

  describe('supports()', () => {
    describe('style is supported', () => {
      it('returns true', () => {
        expect(formStyleDeserializer.supports(HttpParamStyles.Form)).toBe(true);
      });
    });

    describe('style is not supported', () => {
      it('returns false', () => {
        // @ts-ignore
        expect(formStyleDeserializer.supports('invalid')).toBe(false);
      });
    });
  });

  describe('deserialize()', () => {
    describe('schema type is a primitive', () => {
      it('return unmodified value', () => {
        expect(formStyleDeserializer.deserialize('key', { key: 'val' }, { type: 'string' })).toEqual('val');
      });
    });

    describe('schema type is an array', () => {
      describe('explode is set', () => {
        describe('query param is an array', () => {
          it('returns unmodified value', () => {
            expect(
              formStyleDeserializer.deserialize('key', { key: ['val1', 'val2'] }, { type: 'array' }, true)
            ).toEqual(['val1', 'val2']);
          });
        });

        describe('query param is a value', () => {
          it('returns single-value array', () => {
            expect(formStyleDeserializer.deserialize('key', { key: 'val' }, { type: 'array' }, true)).toEqual(['val']);
          });
        });
      });

      describe('explode is not set', () => {
        describe('query param is an array', () => {
          it('splits last query param value', () => {
            expect(
              formStyleDeserializer.deserialize('key', { key: ['a,b,c', 'd,e,f'] }, { type: 'array' }, false)
            ).toEqual(['d', 'e', 'f']);
          });
        });

        describe('query param is a value', () => {
          it('splits query param value', () => {
            expect(formStyleDeserializer.deserialize('key', { key: 'a,b,c' }, { type: 'array' }, false)).toEqual([
              'a',
              'b',
              'c',
            ]);
          });
        });
      });
    });

    describe('schema type is an object', () => {
      describe('explode is set', () => {
        it('returns object', () => {
          expect(
            formStyleDeserializer.deserialize(
              'a',
              { a: 'b', c: 'd' },
              { type: 'object', properties: { a: { type: 'string' } } },
              true
            )
          ).toEqual({ a: 'b' });
        });

        describe('schema properties are missing', () => {
          it('returns empty object', () => {
            expect(formStyleDeserializer.deserialize('-', {}, { type: 'object' }, true)).toBeUndefined();
          });
        });
      });

      describe('explode is not set', () => {
        describe('query param is an array', () => {
          it('splits last query param value into object', () => {
            jest.spyOn(createObjectFromKeyValListModule, 'createObjectFromKeyValList').mockImplementationOnce(list => {
              expect(list).toEqual(['a', 'b', 'c', 'd']);
              return { a: 'b', c: 'd' };
            });

            expect(
              formStyleDeserializer.deserialize('key', { key: ['e,f,g,h', 'a,b,c,d'] }, { type: 'object' }, false)
            ).toEqual({ a: 'b', c: 'd' });

            expect(createObjectFromKeyValListModule.createObjectFromKeyValList).toHaveBeenCalled();
          });
        });

        describe('query param is a value', () => {
          it('splits query param value into object', () => {
            jest.spyOn(createObjectFromKeyValListModule, 'createObjectFromKeyValList').mockImplementationOnce(list => {
              expect(list).toEqual(['a', 'b', 'c', 'd']);
              return { a: 'b', c: 'd' };
            });

            expect(formStyleDeserializer.deserialize('key', { key: 'a,b,c,d' }, { type: 'object' }, false)).toEqual({
              a: 'b',
              c: 'd',
            });

            expect(createObjectFromKeyValListModule.createObjectFromKeyValList).toHaveBeenCalled();
          });
        });
      });
    });
  });
});
