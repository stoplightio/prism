import { findOperationResponse } from '../spec';

describe('findOperationResponse()', () => {
  describe('when response for given code exists', () => {
    it('returns found response', () => {
      expect(
        findOperationResponse(
          [
            { code: '2XX', contents: [], headers: [] },
            { code: '20X', contents: [], headers: [] },
            { code: 'default', contents: [], headers: [] },
            { code: '1XX', contents: [], headers: [] },
          ],
          200,
        ),
      ).toEqual({ code: '20X', contents: [], headers: [] });
    });
  });

  describe('when response for given code does not exists but there is a default response', () => {
    it('returns default response', () => {
      expect(
        findOperationResponse(
          [
            { code: '2XX', contents: [], headers: [] },
            { code: 'default', contents: [], headers: [] },
            { code: '1XX', contents: [], headers: [] },
          ],
          422,
        ),
      ).toEqual({ code: 'default', contents: [], headers: [] });
    });
  });

  describe('when default response is specified with mixed case', () => {
    it('returns default response', () => {
      expect(
        findOperationResponse(
          [
            { code: '2XX', contents: [], headers: [] },
            { code: 'deFAULT', contents: [], headers: [] },
            { code: '1XX', contents: [], headers: [] },
          ],
          422,
        ),
      ).toEqual({ code: 'deFAULT', contents: [], headers: [] });
    });
  });

  describe('when response for given code does not exists and there is no default response', () => {
    it('returns nothing', () => {
      expect(
        findOperationResponse(
          [{ code: '2XX', contents: [], headers: [] }, { code: '1XX', contents: [], headers: [] }],
          500,
        ),
      ).toBeUndefined();
    });
  });
});
