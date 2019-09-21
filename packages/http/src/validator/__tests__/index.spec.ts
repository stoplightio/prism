import { IPrismDiagnostic } from '@stoplight/prism-core';
import { DiagnosticSeverity, IHttpOperation } from '@stoplight/types';
import { IHttpRequest } from '../../types';
import { bodyValidator, headersValidator, queryValidator, validateInput, validateOutput } from '../index';
import * as findResponseSpecModule from '../utils/spec';

const mockError: IPrismDiagnostic = {
  message: 'mocked C is required',
  code: 'required',
  path: ['mocked-b'],
  severity: DiagnosticSeverity.Error,
};

describe('HttpValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(findResponseSpecModule, 'findOperationResponse').mockReturnValue(undefined);
    jest.spyOn(bodyValidator, 'validate').mockReturnValue([mockError]);
    jest.spyOn(headersValidator, 'validate').mockReturnValue([mockError]);
    jest.spyOn(queryValidator, 'validate').mockReturnValue([mockError]);
  });

  describe('validateInput()', () => {
    describe('body validation in enabled', () => {
      const validate = (resourceExtension: Partial<IHttpOperation> | undefined, errorsNumber: number) => () => {
        expect(
          validateInput({
            resource: Object.assign(
              {
                method: 'get',
                path: '/',
                id: '1',
                request: {},
                responses: [{ code: '200' }],
              },
              resourceExtension,
            ),
            element: { method: 'get', url: { path: '/' } },
          }),
        ).toHaveLength(errorsNumber);
      };

      describe('request.body is set', () => {
        describe('request body is not required', () => {
          it(
            'does not try to validate the body',
            validate(
              {
                request: { body: { contents: [] }, path: [], query: [], headers: [], cookie: [] },
              },
              2,
            ),
          );
        });

        describe('request body is required', () => {
          it(
            'tries to validate the body',
            validate(
              {
                method: 'get',
                path: '/',
                id: '1',
                request: { body: { contents: [], required: true } },
                responses: [{ code: '200' }],
              },
              3,
            ),
          );
        });
      });
    });
  });

  describe('headers validation in enabled', () => {
    const validate = (resourceExtension?: Partial<IHttpOperation>, length: number = 1) => () => {
      expect(
        validateInput({
          resource: Object.assign(
            {
              method: 'get',
              path: '/',
              id: '1',
              request: {},
              responses: [{ code: '200' }],
            },
            resourceExtension,
          ),
          element: { method: 'get', url: { path: '/' } },
        }),
      ).toHaveLength(length);
    };

    describe('request is not set', () => {
      it('validates headers', validate(undefined, 2));
    });
  });

  describe('query validation in enabled', () => {
    const validate = (
      resourceExtension?: Partial<IHttpOperation>,
      inputExtension?: Partial<IHttpRequest>,
      length: number = 2,
    ) => () => {
      expect(
        validateInput({
          resource: Object.assign(
            {
              method: 'get',
              path: '/',
              id: '1',
              request: {},
              responses: [{ code: '200' }],
            },
            resourceExtension,
          ),
          element: Object.assign({ method: 'get', url: { path: '/', query: {} } }, inputExtension),
        }),
      ).toHaveLength(length);

      expect(bodyValidator.validate).not.toHaveBeenCalled();
      expect(headersValidator.validate).toHaveBeenCalled();
      expect(queryValidator.validate).toHaveBeenCalledWith({}, []);
    };

    describe('request is not set', () => {
      it('validates query', validate(undefined, undefined, 2));
    });

    describe('request is set', () => {
      describe('request.query is not set', () => {
        it('validates query', validate({ request: {} }, undefined, 2));
      });

      describe('request.query is set', () => {
        it('validates query', validate({ request: {} }, undefined, 2));
      });
    });

    describe('input.url.query is not set', () => {
      it("validates query assuming it's empty", validate(undefined, { url: { path: '/' } }));
    });
  });

  describe('validateOutput()', () => {
    describe('output is set', () => {
      it('validates the body and headers', () => {
        expect(
          validateOutput({
            resource: {
              method: 'get',
              path: '/',
              id: '1',
              request: {},
              responses: [{ code: '200' }],
            },
            element: { statusCode: 200 },
          }),
        ).toHaveLength(2);

        expect(findResponseSpecModule.findOperationResponse).toHaveBeenCalled();
        expect(bodyValidator.validate).toHaveBeenCalledWith(undefined, [], undefined);
        expect(headersValidator.validate).toHaveBeenCalled();
      });
    });
  });
});
