import { DiagnosticSeverity, IHttpContent, IHttpHeaderParam, IHttpOperation, IHttpQueryParam } from '@stoplight/types';

import { IPrismDiagnostic } from '@stoplight/prism-core/src';
import { IHttpNameValue, IHttpNameValues } from '../../types';
import { IHttpRequest } from '../../types';
import { HttpValidator } from '../index';
import * as resolveValidationConfigModule from '../utils/config';
import * as findResponseSpecModule from '../utils/spec';
import { IHttpValidator } from '../validators/types';

const mockError: IPrismDiagnostic = {
  message: 'c is required',
  code: 'required',
  path: ['b'],
  severity: DiagnosticSeverity.Error,
};

describe('HttpValidator', () => {
  const httpBodyValidator = { validate: () => [mockError] } as IHttpValidator<any, IHttpContent>;
  const httpHeadersValidator = { validate: () => [mockError] } as IHttpValidator<IHttpNameValue, IHttpHeaderParam>;
  const httpQueryValidator = { validate: () => [mockError] } as IHttpValidator<IHttpNameValues, IHttpQueryParam>;
  const httpValidator = new HttpValidator(httpBodyValidator, httpHeadersValidator, httpQueryValidator);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(resolveValidationConfigModule, 'resolveRequestValidationConfig');
    jest.spyOn(resolveValidationConfigModule, 'resolveResponseValidationConfig');
    jest.spyOn(findResponseSpecModule, 'findOperationResponse').mockReturnValue(undefined);
    jest.spyOn(httpBodyValidator, 'validate');
    jest.spyOn(httpHeadersValidator, 'validate');
    jest.spyOn(httpQueryValidator, 'validate');
  });

  describe('validateInput()', () => {
    describe('body validation in enabled', () => {
      const test = (extendResource?: Partial<IHttpOperation>) => async () => {
        jest
          .spyOn(resolveValidationConfigModule, 'resolveRequestValidationConfig')
          .mockReturnValueOnce({ body: true, headers: false, hijack: false, query: false });

        await expect(
          httpValidator.validateInput({
            resource: Object.assign(
              {
                method: 'get',
                path: '/',
                responses: [],
                id: '1',
                servers: [],
                security: [],
                request: { headers: [], cookie: [], query: [], path: [] },
              },
              extendResource,
            ),
            input: { method: 'get', url: { path: '/' } },
            config: { mock: { dynamic: false }, validate: { request: { body: true } } },
          }),
        ).resolves.toEqual([mockError]);

        expect(resolveValidationConfigModule.resolveRequestValidationConfig).toHaveBeenCalled();
        expect(httpBodyValidator.validate).toHaveBeenCalledWith(undefined, [], undefined);
        expect(httpHeadersValidator.validate).not.toHaveBeenCalled();
        expect(httpQueryValidator.validate).not.toHaveBeenCalled();
      };

      describe('request is not set', () => {
        it('validates body', test());
      });

      describe('request is set', () => {
        describe('request.body is not set', () => {
          it('validates body', test({ request: { path: [], headers: [], query: [], cookie: [] } }));
        });

        describe('request.body is set', () => {
          it(
            'validates body',
            test({
              request: { body: { contents: [] }, path: [], query: [], headers: [], cookie: [] },
            }),
          );
        });
      });
    });

    describe('headers validation in enabled', () => {
      const test = (extendResource?: Partial<IHttpOperation>) => async () => {
        jest
          .spyOn(resolveValidationConfigModule, 'resolveRequestValidationConfig')
          .mockReturnValueOnce({ body: false, headers: true, hijack: false, query: false });

        await expect(
          httpValidator.validateInput({
            resource: Object.assign(
              {
                method: 'get',
                path: '/',
                responses: [],
                id: '1',
                servers: [],
                security: [],
                request: { path: [], query: [], cookie: [], headers: [] },
              },
              extendResource,
            ),
            input: { method: 'get', url: { path: '/' } },
            config: { mock: { dynamic: false }, validate: { request: { headers: true } } },
          }),
        ).resolves.toEqual([mockError]);

        expect(resolveValidationConfigModule.resolveRequestValidationConfig).toHaveBeenCalled();
        expect(httpBodyValidator.validate).not.toHaveBeenCalled();
        expect(httpHeadersValidator.validate).toHaveBeenCalledWith({}, [], undefined);
        expect(httpQueryValidator.validate).not.toHaveBeenCalled();
      };

      describe('request is not set', () => {
        it('validates headers', test());
      });

      describe('request is set', () => {
        describe('request.headers is not set', () => {
          it('validates headers', test({ request: { path: [], query: [], cookie: [], headers: [] } }));
        });

        describe('request.headers is set', () => {
          it('validates headers', test({ request: { path: [], query: [], cookie: [], headers: [] } }));
        });
      });
    });

    describe('query validation in enabled', () => {
      const test = (extendResource?: Partial<IHttpOperation>, extendInput?: Partial<IHttpRequest>) => async () => {
        jest
          .spyOn(resolveValidationConfigModule, 'resolveRequestValidationConfig')
          .mockReturnValueOnce({ body: false, headers: false, hijack: false, query: true });

        await expect(
          httpValidator.validateInput({
            resource: Object.assign(
              {
                method: 'get',
                path: '/',
                responses: [],
                id: '1',
                servers: [],
                security: [],
                request: { path: [], query: [], cookie: [], headers: [] },
              },
              extendResource,
            ),
            input: Object.assign({ method: 'get', url: { path: '/', query: {} } }, extendInput),
            config: { mock: { dynamic: false }, validate: { request: { query: true } } },
          }),
        ).resolves.toEqual([mockError]);

        expect(resolveValidationConfigModule.resolveRequestValidationConfig).toHaveBeenCalled();
        expect(httpBodyValidator.validate).not.toHaveBeenCalled();
        expect(httpHeadersValidator.validate).not.toHaveBeenCalled();
        expect(httpQueryValidator.validate).toHaveBeenCalledWith({}, [], undefined);
      };

      describe('request is not set', () => {
        it('validates query', test());
      });

      describe('request is set', () => {
        describe('request.query is not set', () => {
          it('validates query', test({ request: { path: [], query: [], cookie: [], headers: [] } }));
        });

        describe('request.query is set', () => {
          it('validates query', test({ request: { path: [], query: [], cookie: [], headers: [] } }));
        });
      });

      describe('input.url.query is not set', () => {
        it("validates query assuming it's empty", test(undefined, { url: { path: '/' } }));
      });
    });
  });

  describe('validateOutput()', () => {
    describe('output is not set', () => {
      it('omits validation', async () => {
        await expect(
          httpValidator.validateOutput({
            resource: {
              method: 'get',
              path: '/',
              responses: [],
              id: '1',
              servers: [],
              security: [],
              request: { path: [], query: [], cookie: [], headers: [] },
            },
            config: { mock: { dynamic: false }, validate: { response: { body: true } } },
          }),
        ).resolves.toEqual([]);

        expect(httpBodyValidator.validate).not.toHaveBeenCalled();
      });
    });

    describe('output is set', () => {
      describe('body validation is enabled', () => {
        it('validates body', async () => {
          jest
            .spyOn(resolveValidationConfigModule, 'resolveResponseValidationConfig')
            .mockReturnValueOnce({ headers: false, body: true });

          await expect(
            httpValidator.validateOutput({
              resource: {
                method: 'get',
                path: '/',
                responses: [],
                id: '1',
                servers: [],
                security: [],
                request: { query: [], path: [], cookie: [], headers: [] },
              },
              output: { statusCode: 200 },
              config: { mock: { dynamic: false }, validate: { response: { body: true } } },
            }),
          ).resolves.toEqual([mockError]);

          expect(resolveValidationConfigModule.resolveResponseValidationConfig).toHaveBeenCalled();
          expect(findResponseSpecModule.findOperationResponse).toHaveBeenCalled();
          expect(httpBodyValidator.validate).toHaveBeenCalledWith(undefined, [], undefined);
          expect(httpHeadersValidator.validate).not.toHaveBeenCalled();
        });
      });

      describe('headers validation is enabled', () => {
        it('validates headers', async () => {
          jest
            .spyOn(resolveValidationConfigModule, 'resolveResponseValidationConfig')
            .mockReturnValueOnce({ headers: true, body: false });

          await expect(
            httpValidator.validateOutput({
              resource: {
                method: 'get',
                path: '/',
                responses: [],
                id: '1',
                servers: [],
                security: [],
                request: { query: [], path: [], cookie: [], headers: [] },
              },
              output: { statusCode: 200 },
              config: { mock: { dynamic: false }, validate: { response: { headers: true } } },
            }),
          ).resolves.toEqual([mockError]);

          expect(resolveValidationConfigModule.resolveResponseValidationConfig).toHaveBeenCalled();
          expect(findResponseSpecModule.findOperationResponse).toHaveBeenCalled();
          expect(httpBodyValidator.validate).not.toHaveBeenCalled();
          expect(httpHeadersValidator.validate).toHaveBeenCalledWith({}, [], undefined);
        });
      });
    });
  });
});
