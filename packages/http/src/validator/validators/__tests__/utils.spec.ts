import { DiagnosticSeverity } from '@stoplight/types';
import * as convertAjvErrorsModule from '../utils';
import { convertAjvErrors, validateAgainstSchema } from '../utils';
import type { ErrorObject } from 'ajv';
import { assertSome, assertNone } from '@stoplight/prism-core/src/__tests__/utils';
import type { JSONSchema7 } from 'json-schema';
import { ValidationContext } from '../types';

describe('convertAjvErrors()', () => {
  const errorObjectFixture: ErrorObject = {
    instancePath: '/a/b',
    keyword: 'required',
    message: 'c is required',
    schemaPath: '..',
    params: {},
  };

  describe('all fields defined', () => {
    it('converts properly', () => {
      expect(
        convertAjvErrors([errorObjectFixture], DiagnosticSeverity.Error, ValidationContext.Input)
      ).toMatchSnapshot();
    });
  });

  describe('keyword field is missing', () => {
    it('converts properly', () => {
      expect(
        convertAjvErrors(
          [Object.assign({}, errorObjectFixture, { keyword: undefined })],
          DiagnosticSeverity.Error,
          ValidationContext.Input
        )
      ).toMatchSnapshot();
    });
  });

  describe('message field is missing', () => {
    it('converts properly', () => {
      expect(
        convertAjvErrors(
          [Object.assign({}, errorObjectFixture, { message: undefined })],
          DiagnosticSeverity.Error,
          ValidationContext.Input
        )[0]
      ).toHaveProperty('message', 'Request parameter a.b ');
    });
  });

  describe('has unevaluated property', () => {
    it('converts properly', () => {
      expect(
        convertAjvErrors(
          [Object.assign({}, errorObjectFixture, {
            params: { unevaluatedProperty: 'd' },
            keyword: 'unevaluatedProperties',
            message: 'must NOT have unevaluated propertes',
          })],
          DiagnosticSeverity.Error,
          ValidationContext.Input
        )[0]
      ).toHaveProperty('message', "Request parameter a.b must NOT have unevaluated propertes: 'd'");
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
      assertNone(validateAgainstSchema('test', { type: 'string' }, true, ValidationContext.Input, 'pfx'));
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
      assertSome(validateAgainstSchema('test', { type: 'number' }, true, ValidationContext.Input, 'pfx'), error =>
        expect(error).toContainEqual(expect.objectContaining({ message: 'should be number' }))
      );

      expect(convertAjvErrorsModule.convertAjvErrors).toHaveBeenCalledWith(
        [
          {
            instancePath: '',
            keyword: 'type',
            message: 'must be number',
            params: { type: 'number' },
            schemaPath: '#/type',
          },
        ],
        DiagnosticSeverity.Error,
        ValidationContext.Input,
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

      assertSome(validateAgainstSchema('test', numberSchema, true, ValidationContext.Input, 'pfx'), error => {
        expect(error).toEqual([expect.objectContaining({ path: ['pfx'], message: 'Request pfx must be number' })]);
      });

      const arr = [{ id: 11 }, { status: 'TODO' }];

      assertSome(validateAgainstSchema(arr, rootArraySchema, true, ValidationContext.Input, 'pfx'), error => {
        expect(error).toEqual([
          expect.objectContaining({
            path: ['pfx', '1'],
            message: "Request pfx parameter 1 must have required property 'id'",
          }),
        ]);
      });

      const obj = { data: arr };

      assertSome(validateAgainstSchema(obj, nestedArraySchema, true, ValidationContext.Input, 'pfx'), error => {
        expect(error).toEqual([
          expect.objectContaining({
            path: ['pfx', 'data', '1'],
            message: "Request pfx parameter data.1 must have required property 'id'",
          }),
        ]);
      });

      const obj2 = { value: { data: arr } };

      assertSome(
        validateAgainstSchema(obj2, evenMoreNestedArraySchema, true, ValidationContext.Input, 'pfx'),
        error => {
          expect(error).toEqual([
            expect.objectContaining({
              path: ['pfx', 'value', 'data', '1'],
              message: "Request pfx parameter value.data.1 must have required property 'id'",
            }),
          ]);
        }
      );

      const arr2 = [{ id: [false] }];

      assertSome(validateAgainstSchema(arr2, rootArraySchema, true, ValidationContext.Input, 'pfx'), error => {
        expect(error).toEqual([
          expect.objectContaining({ path: ['pfx', '0', 'id'], message: 'Request pfx parameter 0.id must be number' }),
        ]);
      });

      const arr3 = [{ id: 11 }, { status: 'TODONT' }];

      assertSome(validateAgainstSchema(arr3, rootArraySchema, true, ValidationContext.Input, 'pfx'), error => {
        expect(error).toEqual([
          expect.objectContaining({
            path: ['pfx', '1'],
            message: "Request pfx parameter 1 must have required property 'id'",
          }),
          expect.objectContaining({
            path: ['pfx', '1', 'status'],
            message:
              'Request pfx parameter 1.status must be equal to one of the allowed values: TODO, IN_PROGRESS, CANCELLED, DONE',
          }),
        ]);
      });

      const arr4 = [{ id: 11 }, { id: 12, nope: false, neither: true }];

      assertSome(validateAgainstSchema(arr4, rootArraySchema, true, ValidationContext.Input, 'pfx'), error => {
        expect(error).toEqual([
          expect.objectContaining({
            path: ['pfx', '1'],
            message: "Request pfx parameter 1 must NOT have additional properties; found 'nope'",
          }),
          expect.objectContaining({
            path: ['pfx', '1'],
            message: "Request pfx parameter 1 must NOT have additional properties; found 'neither'",
          }),
        ]);
      });
    });
  });

  describe('with coercing', () => {
    it('will not return error for convertible values', () => {
      assertNone(
        validateAgainstSchema(
          { test: 10 },
          { type: 'object', properties: { test: { type: 'string' } } },
          true,
          ValidationContext.Input
        )
      );
    });
  });

  describe('with no coercing', () => {
    it('will return error for convertible values', () => {
      assertSome(
        validateAgainstSchema(
          { test: 10 },
          { type: 'object', properties: { test: { type: 'string' } } },
          false,
          ValidationContext.Input
        ),
        error =>
          expect(error).toContainEqual(expect.objectContaining({ message: 'Request parameter test must be string' }))
      );
    });
  });

  describe('does not pollute the console with ajv "unknown format" warnings', () => {
    it.each([true, false])('with coerce = %s', (coerce: boolean) => {
      const spy = jest.spyOn(console, 'warn');

      assertNone(
        validateAgainstSchema('test', { type: 'string', format: 'something' }, coerce, ValidationContext.Input)
      );
      expect(spy).not.toHaveBeenCalled();

      spy.mockRestore();
    });
  });
});
