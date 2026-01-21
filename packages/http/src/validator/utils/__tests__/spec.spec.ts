import { assertNone, assertSome } from '@stoplight/prism-core/src/__tests__/utils';
import { findOperationResponse } from '../spec';
import { faker } from '@faker-js/faker';

describe('findOperationResponse()', () => {
  describe('when response for given code exists', () => {
    it('returns found response', () => {
      assertSome(
        findOperationResponse(
          [
            { id: faker.lorem.word(), code: '2XX', contents: [], headers: [] },
            { id: faker.lorem.word(), code: '20X', contents: [], headers: [] },
            { id: faker.lorem.word(), code: 'default', contents: [], headers: [] },
            { id: faker.lorem.word(), code: '1XX', contents: [], headers: [] },
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
            { id: faker.lorem.word(), code: '2XX', contents: [], headers: [] },
            { id: faker.lorem.word(), code: 'default', contents: [], headers: [] },
            { id: faker.lorem.word(), code: '1XX', contents: [], headers: [] },
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
            { id: faker.lorem.word(), code: '2XX', contents: [], headers: [] },
            { id: faker.lorem.word(), code: '1XX', contents: [], headers: [] },
          ],
          500
        )
      );
    });
  });
});
