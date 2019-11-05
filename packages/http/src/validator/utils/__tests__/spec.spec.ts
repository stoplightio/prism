import { assertNone, assertSome } from '@stoplight/prism-core/src/__tests__/utils';
import { findOperationResponse } from '../spec';

describe('findOperationResponse()', () => {
  describe('when response for given code exists', () => {
    it('returns found response', () => {
      assertSome(
        findOperationResponse(
          [
            { code: '2XX', contents: [], headers: [] },
            { code: '20X', contents: [], headers: [] },
            { code: 'default', contents: [], headers: [] },
            { code: '1XX', contents: [], headers: [] },
          ],
          200,
        ),
        value => expect(value).toEqual({ code: '20X', contents: [], headers: [] }),
      );
    });
  });

  describe('when response for given code does not exists but there is a default response', () => {
    it('returns default response', () => {
      assertSome(
        findOperationResponse(
          [
            { code: '2XX', contents: [], headers: [] },
            { code: 'default', contents: [], headers: [] },
            { code: '1XX', contents: [], headers: [] },
          ],
          422,
        ),
        value => expect(value).toEqual({ code: 'default', contents: [], headers: [] }),
      );
    });
  });

  describe('when response for given code does not exists and there is no default response', () => {
    it('returns nothing', () => {
      assertNone(
        findOperationResponse(
          [{ code: '2XX', contents: [], headers: [] }, { code: '1XX', contents: [], headers: [] }],
          500,
        ),
      );
    });
  });
});
