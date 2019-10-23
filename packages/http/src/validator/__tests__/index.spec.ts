import { IPrismDiagnostic } from '@stoplight/prism-core';
import { DiagnosticSeverity, IHttpOperation } from '@stoplight/types';
import * as Either from 'fp-ts/lib/Either'
import { IHttpRequest } from '../../types';
import { bodyValidator, headersValidator, queryValidator, validateInput, validateOutput } from '../index';
import { assertRight, assertLeft } from '@stoplight/prism-core/src/utils/__tests__/utils';

const mockError: IPrismDiagnostic = {
  message: 'mocked C is required',
  code: 'required',
  path: ['mocked-b'],
  severity: DiagnosticSeverity.Error,
};

describe('HttpValidator', () => {
  describe('validateInput()', () => {
    beforeAll(() => {
      jest.spyOn(bodyValidator, 'validate').mockReturnValue(Either.left([mockError]));
      jest.spyOn(headersValidator, 'validate').mockReturnValue(Either.left([mockError]));
      jest.spyOn(queryValidator, 'validate').mockReturnValue(Either.left([mockError]));
    });

    afterAll(() => jest.restoreAllMocks());

    describe('body validation in enabled', () => {
      const validate = (resourceExtension: Partial<IHttpOperation> | undefined, errorsNumber: number) => () => {
        assertLeft(
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
          }), error => expect(error).toHaveLength(errorsNumber));
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

    describe('headers validation in enabled', () => {
      const validate = (resourceExtension?: Partial<IHttpOperation>, length = 1) => () => {
        assertLeft(
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
          }), error => expect(error).toHaveLength(length));
      };

      describe('request is not set', () => {
        it('validates headers', validate(undefined, 2));
      });
    });

    describe('query validation in enabled', () => {
      const validate = (
        resourceExtension?: Partial<IHttpOperation>,
        inputExtension?: Partial<IHttpRequest>,
        length = 2,
      ) => () => {
        assertLeft(
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
          }), error => expect(error).toHaveLength(length));

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
  });

  describe('validateOutput()', () => {
    describe('output is set', () => {
      beforeAll(() => {
        jest.spyOn(bodyValidator, 'validate').mockReturnValue(Either.left([mockError]));
        jest.spyOn(headersValidator, 'validate').mockReturnValue(Either.left([mockError]));
        jest.spyOn(queryValidator, 'validate').mockReturnValue(Either.left([mockError]));
      });

      afterAll(() => jest.restoreAllMocks());

      it('validates the body and headers', () => {
        assertLeft(
          validateOutput({
            resource: {
              method: 'get',
              path: '/',
              id: '1',
              request: {},
              responses: [{ code: '200' }],
            },
            element: { statusCode: 200 },
          }), error => expect(error).toHaveLength(3));

        expect(bodyValidator.validate).toHaveBeenCalledWith(undefined, [], undefined);
        expect(headersValidator.validate).toHaveBeenCalled();
      });
    });

    describe('cannot match status code with responses', () => {
      beforeEach(() => {
        jest.spyOn(bodyValidator, 'validate').mockReturnValue(Either.right({}));
        jest.spyOn(headersValidator, 'validate').mockReturnValue(Either.right({}));
      });

      afterEach(() => jest.clearAllMocks());

      const resource: IHttpOperation = {
        method: 'get',
        path: '/',
        id: '1',
        request: {},
        responses: [{ code: '200' }],
      };

      describe('when the desidered response is between 200 and 300', () => {
        it('returns an error', () => {
          assertLeft(validateOutput({ resource, element: { statusCode: 201 } }), error => expect(error).toEqual([
            {
              message: 'Unable to match the returned status code with those defined in spec',
              severity: DiagnosticSeverity.Error,
            },
          ]));
        });
      });

      describe('when the desidered response is over 300', () => {
        it('returns an error', () => {
          assertLeft(validateOutput({ resource, element: { statusCode: 400 } }), error => expect(error).toEqual([
            {
              message: 'Unable to match the returned status code with those defined in spec',
              severity: DiagnosticSeverity.Warning,
            },
          ]));
        });
      });
    });

    describe('returned response media type', () => {
      const resource: IHttpOperation = {
        method: 'get',
        path: '/',
        id: '1',
        request: {},
        responses: [
          {
            code: '200',
            contents: [
              {
                mediaType: 'application/json',
                schema: {
                  type: 'string',
                },
              },
            ],
          },
        ],
      };

      describe('when the response has a content type not declared in the spec', () => {
        it('returns an error', () => {
          assertLeft(
            validateOutput({ resource, element: { statusCode: 200, headers: { 'content-type': 'application/xml' } } }),
            error => expect(error).toEqual([
              {
                message: 'The received media type does not match the one specified in the document',
                severity: DiagnosticSeverity.Error,
              },
            ]));
        });
      });

      describe('when the response has a content type declared in the spec', () => {
        it('returns an error', () => {
          assertRight(validateOutput({ resource, element: { statusCode: 200, headers: { 'content-type': 'application/json' } } }), () => { });
        });
      });
    });
  });
});
