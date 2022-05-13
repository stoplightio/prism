import { assertNone, assertSome } from '@stoplight/prism-core/src/__tests__/utils';
import { findOperationResponse } from '../spec';
import * as faker from '@faker-js/faker/locale/en';

describe('findOperationResponse()', () => {
  describe('when response for given code exists', () => {
    it('returns found response', () => {
      assertSome(
        findOperationResponse(
          [
            { id: faker.random.word(), code: '2XX', contents: [], headers: [] },
            { id: faker.random.word(), code: '20X', contents: [], headers: [] },
            { id: faker.random.word(), code: 'default', contents: [], headers: [] },
            { id: faker.random.word(), code: '1XX', contents: [], headers: [] },
          ],
          200
        ),
        value => expect(value).toEqual({ id: expect.any(String), code: '20X', contents: [], headers: [] })
      );
    });
  });

  describe('when response for given code does not exists but there is a default response', () => {
    it('returns default response', () => {
      assertSome(
        findOperationResponse(
          [
            { id: faker.random.word(), code: '2XX', contents: [], headers: [] },
            { id: faker.random.word(), code: 'default', contents: [], headers: [] },
            { id: faker.random.word(), code: '1XX', contents: [], headers: [] },
          ],
          422
        ),
        value => expect(value).toEqual({ id: expect.any(String), code: 'default', contents: [], headers: [] })
      );
    });
  });

  describe('when response for given code does not exists and there is no default response', () => {
    it('returns nothing', () => {
      assertNone(
        findOperationResponse(
          [
            { id: faker.random.word(), code: '2XX', contents: [], headers: [] },
            { id: faker.random.word(), code: '1XX', contents: [], headers: [] },
          ],
          500
        )
      );
    });
  });
});
