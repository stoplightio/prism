import { DiagnosticSeverity } from '@stoplight/types';
import * as convertAjvErrorsModule from '../utils';
import { convertAjvErrors, validateAgainstSchema } from '../utils';
import type { ErrorObject } from 'ajv';
import { assertSome, assertNone } from '@stoplight/prism-core/src/__tests__/utils';
import type { JSONSchema7 } from 'json-schema';

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
      const numberSchema: JSONSchema7 = {
        type: 'number',
      };

      const rootArraySchema: JSONSchema7 = {
        type: 'array',
        items: {
          type: 'object',
          required: ['id'],
          additionalProperties: false,
          properties: {
            id: numberSchema,
            status: {
              type: 'string',
              enum: ['TODO', 'IN_PROGRESS', 'CANCELLED', 'DONE'],
            },
          },
        },
      };

      const nestedArraySchema: JSONSchema7 = {
        type: 'object',
        properties: {
          data: rootArraySchema,
        },
      };

      const evenMoreNestedArraySchema: JSONSchema7 = {
        type: 'object',
        properties: {
          value: nestedArraySchema,
        },
      };

      assertSome(validateAgainstSchema('test', numberSchema, true, 'pfx'), error => {
        expect(error).toEqual([expect.objectContaining({ path: ['pfx'], message: 'should be number' })]);
      });

      const arr = [{ id: 11 }, { status: 'TODO' }];

      assertSome(validateAgainstSchema(arr, rootArraySchema, true, 'pfx'), error => {
        expect(error).toEqual([
          expect.objectContaining({ path: ['pfx', '[1]'], message: "should have required property 'id'" }),
        ]);
      });

      const obj = { data: arr };

      assertSome(validateAgainstSchema(obj, nestedArraySchema, true, 'pfx'), error => {
        expect(error).toEqual([
          expect.objectContaining({ path: ['pfx', 'data[1]'], message: "should have required property 'id'" }),
        ]);
      });

      const obj2 = { value: { data: arr } };

      assertSome(validateAgainstSchema(obj2, evenMoreNestedArraySchema, true, 'pfx'), error => {
        expect(error).toEqual([
          expect.objectContaining({ path: ['pfx', 'value', 'data[1]'], message: "should have required property 'id'" }),
        ]);
      });

      const arr2 = [{ id: [false] }];

      assertSome(validateAgainstSchema(arr2, rootArraySchema, true, 'pfx'), error => {
        expect(error).toEqual([expect.objectContaining({ path: ['pfx', '[0]', 'id'], message: 'should be number' })]);
      });

      const arr3 = [{ id: 11 }, { status: 'TODONT' }];

      assertSome(validateAgainstSchema(arr3, rootArraySchema, true, 'pfx'), error => {
        expect(error).toEqual([
          expect.objectContaining({ path: ['pfx', '[1]'], message: "should have required property 'id'" }),
          expect.objectContaining({
            path: ['pfx', '[1]', 'status'],
            message: 'should be equal to one of the allowed values: TODO, IN_PROGRESS, CANCELLED, DONE',
          }),
        ]);
      });

      const arr4 = [{ id: 11 }, { id: 12, nope: false, neither: true }];

      assertSome(validateAgainstSchema(arr4, rootArraySchema, true, 'pfx'), error => {
        expect(error).toEqual([
          expect.objectContaining({
            path: ['pfx', '[1]'],
            message: "should NOT have additional properties; found 'nope'",
          }),
          expect.objectContaining({
            path: ['pfx', '[1]'],
            message: "should NOT have additional properties; found 'neither'",
          }),
        ]);
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
