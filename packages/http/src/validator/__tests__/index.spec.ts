import { IPrismDiagnostic } from '@stoplight/prism-core';
import { DiagnosticSeverity, IHttpContent, IHttpHeaderParam, IHttpOperation, IHttpQueryParam } from '@stoplight/types';
import { IHttpNameValue, IHttpNameValues } from '../../types';
import { IHttpRequest } from '../../types';
import { HttpValidator } from '../index';
import * as findResponseSpecModule from '../utils/spec';
import { IHttpValidator } from '../validators/types';

const mockError: IPrismDiagnostic = {
  message: 'mocked C is required',
  code: 'required',
  path: ['mocked-b'],
  severity: DiagnosticSeverity.Error,
};

describe('HttpValidator', () => {
  const httpBodyValidator = { validate: () => [mockError] } as IHttpValidator<any, IHttpContent>;
  const httpHeadersValidator = { validate: () => [mockError] } as IHttpValidator<IHttpNameValue, IHttpHeaderParam>;
  const httpQueryValidator = { validate: () => [mockError] } as IHttpValidator<IHttpNameValues, IHttpQueryParam>;
  const httpValidator = new HttpValidator(httpBodyValidator, httpHeadersValidator, httpQueryValidator);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(findResponseSpecModule, 'findOperationResponse').mockReturnValue(undefined);
    jest.spyOn(httpBodyValidator, 'validate');
    jest.spyOn(httpHeadersValidator, 'validate');
    jest.spyOn(httpQueryValidator, 'validate');
  });

  describe('validateInput()', () => {
    describe('body validation in enabled', () => {
      const validate = (resourceExtension: Partial<IHttpOperation> | undefined, errorsNumber: number) => () => {
        expect(
          httpValidator.validateInput({
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
            input: { method: 'get', url: { path: '/' } },
            config: { mock: { dynamic: false }, validateRequest: true, validateResponse: true },
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
        httpValidator.validateInput({
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
          input: { method: 'get', url: { path: '/' } },
          config: { mock: { dynamic: false }, validateRequest: true, validateResponse: true },
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
        httpValidator.validateInput({
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
          input: Object.assign({ method: 'get', url: { path: '/', query: {} } }, inputExtension),
          config: { mock: { dynamic: false }, validateRequest: true, validateResponse: true },
        }),
      ).toHaveLength(length);

      expect(httpBodyValidator.validate).not.toHaveBeenCalled();
      expect(httpHeadersValidator.validate).toHaveBeenCalled();
      expect(httpQueryValidator.validate).toHaveBeenCalledWith({}, [], undefined);
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
    describe('output is not set', () => {
      it('omits validation', () => {
        expect(
          httpValidator.validateOutput({
            resource: {
              method: 'get',
              path: '/',
              id: '1',
              request: {},
              responses: [{ code: '200' }],
            },
            config: { mock: { dynamic: false }, validateRequest: true, validateResponse: true },
          }),
        ).toHaveLength(0);

        expect(httpBodyValidator.validate).not.toHaveBeenCalled();
      });
    });

    describe('output is set', () => {
      it('validates the body and headers', async () => {
        await expect(
          httpValidator.validateOutput({
            resource: {
              method: 'get',
              path: '/',
              id: '1',
              request: {},
              responses: [{ code: '200' }],
            },
            output: { statusCode: 200 },
            config: { mock: { dynamic: false }, validateRequest: true, validateResponse: true },
          }),
        ).toHaveLength(2);

        expect(findResponseSpecModule.findOperationResponse).toHaveBeenCalled();
        expect(httpBodyValidator.validate).toHaveBeenCalledWith(undefined, [], undefined);
        expect(httpHeadersValidator.validate).toHaveBeenCalled();
      });
    });
  });
});
