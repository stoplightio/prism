import { assertNone, assertSome } from '@stoplight/prism-core/src/utils/__tests__/utils';
import matchResponse from '../responseFinder';
import { matchingOrder } from '../responseFinder';

const logger = { trace: jest.fn() };

describe('matchResponse()', () => {
  afterEach(() => {
    logger.trace.mockRestore();
  });

  describe('when a default response is defined', () => {
    it('return 422 response', () => {
      const responses = [{ status: 0, headers: [], body: '', code: `default` }];

      assertSome(matchResponse(responses, logger as any, matchingOrder), obj =>
        expect(obj).toMatchObject({
          code: '422',
        }),
      );

      expect(logger.trace).toHaveBeenCalled();
    });
  });

  describe('when no response is defined', () => {
    it('returns none', () => {
      const responses = [{ status: 0, headers: [], body: '', code: `200` }];

      assertNone(matchResponse(responses, logger as any, matchingOrder));
      expect(logger.trace).toHaveBeenCalled();
    });
  });

  describe('when different responses are defined', () => {
    it('respects the order of returning a proper response', () => {
      const responses = [
        { status: 0, headers: [], body: '', code: `400` },
        { status: 0, headers: [], body: '', code: `401` },
      ];

      assertSome(matchResponse(responses, logger as any, matchingOrder), obj =>
        expect(obj).toMatchObject({
          code: '401',
        }),
      );

      expect(logger.trace).not.toHaveBeenCalled();
    });
  });
});
