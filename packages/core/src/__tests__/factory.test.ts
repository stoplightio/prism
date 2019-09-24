// @ts-ignore
import logger from 'abstract-logging';
import { right } from 'fp-ts/lib/Either';
import { asks } from 'fp-ts/lib/ReaderEither';
import { Logger } from 'pino';
import { factory, IPrismConfig } from '..';

describe('validation', () => {
  const components = {
    validateInput: jest.fn().mockReturnValue(['something']),
    validateOutput: jest.fn().mockReturnValue(['something']),
    route: jest.fn().mockReturnValue(right('hey')),
    logger: { ...logger, child: jest.fn().mockReturnValue(logger) },
    mock: jest.fn().mockReturnValue(asks<Logger, Error, string>(r => 'hey')),
  };

  const prismInstance = factory<string, string, string, IPrismConfig>(
    { mock: { dynamic: false }, validateRequest: false, validateResponse: false, checkSecurity: true },
    components,
  );

  describe.each([
    ['input', 'validateRequest', 'validateInput', 'validateOutput'],
    ['output', 'validateResponse', 'validateOutput', 'validateInput'],
  ])('%s', (_type, fieldType, fnName, reverseFnName) => {
    describe('when enabled', () => {
      beforeAll(async () => {
        const obj: any = {};
        obj[fieldType] = true;
        await prismInstance.request('', [], obj);
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
