import { DiagnosticSeverity } from '@stoplight/types';
import * as convertAjvErrorsModule from '../utils';
import { convertAjvErrors, validateAgainstSchema } from '../utils';
import { ErrorObject } from 'ajv';
import { assertSome, assertNone } from '@stoplight/prism-core/src/__tests__/utils';
import { JSONSchema } from '@stoplight/prism-http';

describe('convertAjvErrors()', () => {
  const errorObjectFixture: ErrorObject = {
    dataPath: 'a.b',
    keyword: 'required',
    message: 'c is required',
    schemaPath: '..',
    params: {},
  };

  describe('all fields defined', () => {
    it('converts properly', () => {
      expect(convertAjvErrors([errorObjectFixture], DiagnosticSeverity.Error)).toMatchSnapshot();
    });
  });

  describe('keyword field is missing', () => {
    it('converts properly', () => {
      expect(
        convertAjvErrors([Object.assign({}, errorObjectFixture, { keyword: undefined })], DiagnosticSeverity.Error)
      ).toMatchSnapshot();
    });
  });

  describe('message field is missing', () => {
    it('converts properly', () => {
      expect(
        convertAjvErrors([Object.assign({}, errorObjectFixture, { message: undefined })], DiagnosticSeverity.Error)[0]
      ).toHaveProperty('message', '');
    });
  });
});

describe('validateAgainstSchema()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(convertAjvErrorsModule, 'convertAjvErrors');
  });

  describe('has no validation errors', () => {
    it('returns no validation errors', () => {
      assertNone(validateAgainstSchema('test', { type: 'string' }, true, 'pfx'));
      expect(convertAjvErrorsModule.convertAjvErrors).not.toHaveBeenCalled();
    });
  });

  describe('has validation errors', () => {
    it('returns validation errors', () => {
      jest.spyOn(convertAjvErrorsModule, 'convertAjvErrors').mockImplementationOnce(() => [
        {
          message: 'should be number',
          code: '10',
          path: [],
          severity: DiagnosticSeverity.Error,
          summary: 'should be number',
        },
      ]);
      assertSome(validateAgainstSchema('test', { type: 'number' }, true, 'pfx'), error =>
        expect(error).toContainEqual(expect.objectContaining({ message: 'should be number' }))
      );

      expect(convertAjvErrorsModule.convertAjvErrors).toHaveBeenCalledWith(
        [
          {
            dataPath: '',
            keyword: 'type',
            message: 'should be number',
            params: { type: 'number' },
            schemaPath: '#/type',
          },
        ],
        DiagnosticSeverity.Error,
        'pfx'
      );
    });

    it('properly returns array based paths when meaningful', () => {
      const numberSchema = {
        type: 'number',
      };

      const rootArraySchema = {
        type: 'array',
        items: {
          type: 'object',
          required: ['id'],
          properties: {
            id: numberSchema,
            status: {
              type: 'string',
              enum: ['TODO', 'IN_PROGRESS', 'CANCELLED', 'DONE'],
            },
          },
        },
      };

      const nestedArraySchema = {
        type: 'object',
        properties: {
          data: rootArraySchema,
        },
      };

      assertSome(validateAgainstSchema('test', numberSchema as JSONSchema, true, 'pfx'), error => {
        expect(error).toEqual([expect.objectContaining({ path: ['pfx'] })]);
      });

      const arr = [{ id: 11 }, { nope: false }];

      assertSome(validateAgainstSchema(arr, rootArraySchema as JSONSchema, true, 'pfx'), error => {
        expect(error).toEqual([expect.objectContaining({ path: ['pfx', '[1]'] })]);
      });

      const obj = { data: arr };

      assertSome(validateAgainstSchema(obj, nestedArraySchema as JSONSchema, true, 'pfx'), error => {
        expect(error).toEqual([expect.objectContaining({ path: ['pfx', 'data[1]'] })]);
      });
    });
  });

  describe('with coercing', () => {
    it('will not return error for convertible values', () => {
      assertNone(
        validateAgainstSchema({ test: 10 }, { type: 'object', properties: { test: { type: 'string' } } }, true)
      );
    });
  });

  describe('with no coercing', () => {
    it('will return error for convertible values', () => {
      assertSome(
        validateAgainstSchema({ test: 10 }, { type: 'object', properties: { test: { type: 'string' } } }, false),
        error => expect(error).toContainEqual(expect.objectContaining({ message: 'should be string' }))
      );
    });
  });
});
