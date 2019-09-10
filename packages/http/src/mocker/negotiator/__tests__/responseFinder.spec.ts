import { assertNone, assertSome } from '@stoplight/prism-core/src/utils/__tests__/utils';
import matchResponse from '../responseFinder';
import { matchingOrder } from '../responseFinder';

const logger = { trace: jest.fn() };

describe('matchResponse()', () => {
  afterEach(() => {
    logger.trace.mockRestore();
  });

  describe('when a default response is given', () => {
    it('returns 422 response', () => {
      const responses = [{ status: 0, headers: [], body: '', code: `default` }];

      assertSome(matchResponse(responses, logger as any, matchingOrder), obj =>
        expect(obj).toMatchObject({
          code: '422',
        }),
      );

      expect(logger.trace).toHaveBeenCalled();
    });
  });

  describe('when no matching response is given', () => {
    it('returns none', () => {
      const responses = [{ status: 0, headers: [], body: '', code: `200` }];

      assertNone(matchResponse(responses, logger as any, matchingOrder));
      expect(logger.trace).toHaveBeenCalled();
    });
  });

  describe('when different matching responses are given', () => {
    it('returns the first response respecting the order', () => {
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
