import { DiagnosticSeverity } from '@stoplight/types';
import * as convertAjvErrorsModule from '../utils';
import { convertAjvErrors, validateAgainstSchema } from '../utils';

describe('convertAjvErrors()', () => {
  const errorObjectFixture = {
    dataPath: 'a.b',
    keyword: 'required',
    message: 'c is required',
    schemaPath: '..',
    params: '',
  };

  describe('all fields defined', () => {
    it('converts properly', () => {
      expect(convertAjvErrors([errorObjectFixture], DiagnosticSeverity.Error)).toMatchSnapshot();
    });
  });

  describe('keyword field is missing', () => {
    it('converts properly', () => {
      expect(
        convertAjvErrors(
          [Object.assign({}, errorObjectFixture, { keyword: undefined })],
          DiagnosticSeverity.Error
        )
      ).toMatchSnapshot();
    });
  });

  describe('message field is missing', () => {
    it('converts properly', () => {
      expect(
        convertAjvErrors(
          [Object.assign({}, errorObjectFixture, { message: undefined })],
          DiagnosticSeverity.Error
        )
      ).toMatchSnapshot();
    });
  });

  describe('errors are not set', () => {
    it('converts properly', () => {
      expect(convertAjvErrors(null, DiagnosticSeverity.Error)).toMatchSnapshot();
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
      expect(validateAgainstSchema('test', { type: 'string' }, 'pfx')).toEqual([]);
      expect(convertAjvErrorsModule.convertAjvErrors).not.toHaveBeenCalled();
    });
  });

  describe('has validation errors', () => {
    it('returns validation errors', () => {
      jest.spyOn(convertAjvErrorsModule, 'convertAjvErrors').mockImplementationOnce(() => [
        {
          message: 'should be number',
          name: 'type',
          path: [],
          severity: DiagnosticSeverity.Error,
          summary: 'should be number',
        },
      ]);
      expect(validateAgainstSchema('test', { type: 'number' }, 'pfx')).toMatchSnapshot();
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
        DiagnosticSeverity.Error
      );
    });
  });
});
