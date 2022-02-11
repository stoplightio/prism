// @ts-ignore
import logger from 'abstract-logging';
import * as E from 'fp-ts/Either';
import { asks } from 'fp-ts/ReaderEither';
import * as TE from 'fp-ts/TaskEither';
import { Logger } from 'pino';
import { factory, IPrismConfig } from '..';

describe('validation', () => {
  const components = {
    validateInput: jest.fn().mockReturnValue(['something']),
    validateOutput: jest.fn().mockReturnValue(['something']),
    validateSecurity: jest.fn().mockReturnValue(['something']),
    route: jest.fn().mockReturnValue(E.right('hey')),
    forward: jest.fn().mockReturnValue(
      TE.right({
        statusCode: 200,
        headers: {},
        body: {},
      })
    ),
    logger: { ...logger, child: jest.fn().mockReturnValue(logger) },
    mock: jest.fn().mockReturnValue(asks<Logger, string, string>(() => 'hey')),
  };

  const prismInstance = factory<string, string, string, IPrismConfig>(
    { mock: { dynamic: false }, validateRequest: false, validateResponse: false, checkSecurity: true, errors: false, upstreamProxy: undefined },
    components
  );

  describe.each([
    ['input', 'validateRequest', 'validateInput', 'validateOutput'],
    ['output', 'validateResponse', 'validateOutput', 'validateInput'],
  ])('%s', (_type, fieldType, fnName, reverseFnName) => {
    describe('when enabled', () => {
      beforeAll(() => {
        const obj: IPrismConfig = {
          checkSecurity: true,
          errors: true,
          validateRequest: false,
          validateResponse: false,
          mock: {},
          upstreamProxy: undefined,
        };

        obj[fieldType] = true;
        return prismInstance.request('', [], obj)();
      });

      afterEach(() => jest.clearAllMocks());
      afterAll(() => jest.restoreAllMocks());

      test('should call the relative validate function', () => expect(components[fnName]).toHaveBeenCalled());
      test('should not call the relative other function', () =>
        expect(components[reverseFnName]).not.toHaveBeenCalled());
    });

    describe('when disabled', () => {
      beforeAll(() => prismInstance.request('', []));
      afterEach(() => jest.clearAllMocks());
      afterAll(() => jest.restoreAllMocks());

      test('should not call the relative validate function', () => expect(components[fnName]).not.toHaveBeenCalled());
      test('should not call the relative other function', () =>
        expect(components[reverseFnName]).not.toHaveBeenCalled());
    });
  });
});
