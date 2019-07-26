import { JSONSchema } from '../../..';
import { HttpBodyValidator } from '../body';

describe('HttpBodyValidator', () => {
  const httpBodyValidator = new HttpBodyValidator('body');

  describe('validate()', () => {
    describe('content specs are missing', () => {
      it('returns no validation errors', () => {
        expect(httpBodyValidator.validate('test', [])).toEqual([]);
      });
    });

    describe('request media type is not provided', () => {
      it('returns no validation errors', () => {
        expect(
          httpBodyValidator.validate('test', [
            { mediaType: 'application/not-exists-son', examples: [], encodings: [] },
          ]),
        ).toEqual([]);
      });
    });

    describe('request media type was not found in spec', () => {
      it('returns no validation errors', () => {
        expect(
          httpBodyValidator.validate(
            'test',
            [{ mediaType: 'application/not-exists-son', examples: [], encodings: [] }],
            'application/json',
          ),
        ).toEqual([]);
      });
    });

    describe('body schema is provided', () => {
      it('return validation errors', () => {
        const mockSchema: JSONSchema = { type: 'number' };
        expect(
          httpBodyValidator.validate(
            'test',
            [{ mediaType: 'application/json', schema: mockSchema, examples: [], encodings: [] }],
            'application/json',
          ),
        ).toMatchSnapshot();
      });
    });

    describe('body schema is not provided', () => {
      it('return validation errors', () => {
        expect(
          httpBodyValidator.validate('123', [{ mediaType: 'application/json', examples: [] }], 'application/xml'),
        ).toStrictEqual([
          {
            detail: 'InvalidChar',
            message: 'char 1 is not expected .',
            severity: 0,
            title: 'Provided example is not an XML file',
          },
        ]);
      });
    });
  });
});
