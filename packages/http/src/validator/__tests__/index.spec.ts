import { IPrismDiagnostic } from '@stoplight/prism-core';
import { DiagnosticSeverity, IHttpOperation, HttpParamStyles } from '@stoplight/types';
import * as Either from 'fp-ts/lib/Either';
import { IHttpRequest } from '../../types';
import * as validator from '../index';
import { assertRight, assertLeft } from '@stoplight/prism-core/src/__tests__/utils';

const validate = (
  resourceExtension?: Partial<IHttpOperation>,
  inputExtension?: Partial<IHttpRequest>,
  length = 3
) => () => {
  const validationResult = validator.validateInput({
    resource: Object.assign<IHttpOperation, unknown>(
      {
        method: 'get',
        path: '/',
        id: '1',
        request: {},
        responses: [{ code: '200' }],
      },
      resourceExtension
    ),
    element: Object.assign({ method: 'get', url: { path: '/', query: {} } }, inputExtension),
  });
  length === 0
    ? assertRight(validationResult)
    : assertLeft(validationResult, error => expect(error).toHaveLength(length));
};

const mockError: IPrismDiagnostic = {
  message: 'mocked C is required',
  code: 'required',
  path: ['mocked-b'],
  severity: DiagnosticSeverity.Error,
};

describe('HttpValidator', () => {
  describe('validator.validateInput()', () => {
    beforeAll(() => {
      jest.spyOn(validator.bodyValidator, 'validate').mockReturnValue(Either.left([mockError]));
      jest.spyOn(validator.headersValidator, 'validate').mockReturnValue(Either.left([mockError]));
      jest.spyOn(validator.queryValidator, 'validate').mockReturnValue(Either.left([mockError]));
      jest.spyOn(validator.pathValidator, 'validate').mockReturnValue(Either.left([mockError]));
    });

    afterAll(() => jest.restoreAllMocks());

    describe('body validation in enabled', () => {
      describe('request.body is set', () => {
        describe('request body is not required', () => {
          it(
            'does not try to validate the body',
            validate({ request: { body: { required: false, contents: [] } } }, undefined, 0)
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
              undefined,
              1
            )
          );
        });
      });
    });

    describe('headers validation in enabled', () => {
      describe('request is not set', () => {
        it('does not validate headers', validate(undefined, undefined, 0));
      });
    });

    describe('query validation is enabled', () => {
      describe('request is not set', () => {
        it('does not validate query', validate(undefined, undefined, 0));
      });

      describe('request is set', () => {
        describe('request.query is not set', () => {
          it('does not validate query', validate({ request: {} }, undefined, 0));
        });

        describe('request.query is set', () => {
          it(
            'validates query',
            validate(
              { request: { query: [{ style: HttpParamStyles.SpaceDelimited, name: 'hey', required: true }] } },
              undefined,
              1
            )
          );
        });
      });

      describe('input.url.query is not set', () => {
        it("validates query assuming it's empty", validate(undefined, { url: { path: '/' } }, 0));
      });
    });

    describe('path validation in enabled', () => {
      describe('request is set', () => {
        describe('request.path is set', () => {
          it('calls the path validator', () => {
            validator.validateInput({
              resource: {
                method: 'get',
                path: '/a/{a}/b/{b}',
                id: '1',
                request: {
                  path: [
                    { name: 'a', style: HttpParamStyles.Simple },
                    { name: 'b', style: HttpParamStyles.Matrix },
                  ],
                },
                responses: [{ code: '200' }],
              },
              element: { method: 'get', url: { path: '/a/1/b/;b=2' } },
            });

            expect(validator.pathValidator.validate).toHaveBeenCalledWith({ a: '1', b: ';b=2' }, [
              { name: 'a', style: HttpParamStyles.Simple },
              { name: 'b', style: HttpParamStyles.Matrix },
            ]);
          });
        });
      });
    });
  });

  describe('validateOutput()', () => {
    describe('output is set', () => {
      beforeAll(() => {
        jest.spyOn(validator.bodyValidator, 'validate').mockReturnValue(Either.left([mockError]));
        jest.spyOn(validator.headersValidator, 'validate').mockReturnValue(Either.left([mockError]));
        jest.spyOn(validator.queryValidator, 'validate').mockReturnValue(Either.left([mockError]));
      });

      afterAll(() => jest.restoreAllMocks());

      describe('the output does not have the media type header', () => {
        it('validates the body and headers, but not the media type', () => {
          assertLeft(
            validator.validateOutput({
              resource: {
                method: 'get',
                path: '/',
                id: '1',
                request: {},
                responses: [{ code: '200' }],
              },
              element: { statusCode: 200 },
            }),
            error => expect(error).toHaveLength(2)
          );

          expect(validator.bodyValidator.validate).toHaveBeenCalledWith(undefined, [], undefined);
          expect(validator.headersValidator.validate).toHaveBeenCalled();
        });
      });

      describe('the output has the media type header', () => {
        it('should validate the media type as well', () => {
          assertLeft(
            validator.validateOutput({
              resource: {
                method: 'get',
                path: '/',
                id: '1',
                request: {},
                responses: [{ code: '200', contents: [{ mediaType: 'application/json' }] }],
              },
              element: { statusCode: 200, headers: { 'content-type': 'text/plain' } },
            }),
            e => expect(e).toHaveLength(3)
          );
        });
      });
    });

    describe('cannot match status code with responses', () => {
      beforeEach(() => {
        jest.spyOn(validator.bodyValidator, 'validate').mockReturnValue(Either.right({}));
        jest.spyOn(validator.headersValidator, 'validate').mockReturnValue(Either.right({}));
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
          assertLeft(validator.validateOutput({ resource, element: { statusCode: 201 } }), error =>
            expect(error).toEqual([
              {
                message: 'Unable to match the returned status code with those defined in spec',
                severity: DiagnosticSeverity.Error,
              },
            ])
          );
        });
      });

      describe('when the desidered response is over 300', () => {
        it('returns an error', () => {
          assertLeft(validator.validateOutput({ resource, element: { statusCode: 400 } }), error =>
            expect(error).toEqual([
              {
                message: 'Unable to match the returned status code with those defined in spec',
                severity: DiagnosticSeverity.Warning,
              },
            ])
          );
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
            validator.validateOutput({
              resource,
              element: { statusCode: 200, headers: { 'content-type': 'application/xml' } },
            }),
            error =>
              expect(error).toEqual([
                {
                  message:
                    'The received media type "application/xml" does not match the one specified in the current response: application/json',
                  severity: DiagnosticSeverity.Error,
                },
              ])
          );
        });
      });

      describe('when the response has a content type declared in the spec', () => {
        it('returns an error', () => {
          assertRight(
            validator.validateOutput({
              resource,
              element: { statusCode: 200, headers: { 'content-type': 'application/json' } },
            })
          );
        });
      });
    });
  });
});
