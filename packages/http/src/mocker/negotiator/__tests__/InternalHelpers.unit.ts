import { assertSome } from '@stoplight/prism-core/src/__tests__/utils';
import { findBestHttpContentByMediaType } from '../InternalHelpers';
import * as faker from '@faker-js/faker/locale/en';

describe('InternalHelpers', () => {
  describe('findBestHttpContentByMediaType()', () => {
    describe('with multiple content types for a response', () => {
      const availableResponses = {
        id: faker.random.word(),
        code: '200',
        contents: [
          { id: faker.random.word(), mediaType: 'application/xml' },
          { id: faker.random.word(), mediaType: 'application/json' },
        ],
      };

      it('should respect the q parameter', () => {
        const possibleResponse = findBestHttpContentByMediaType(availableResponses.contents, [
          'application/json;q=0.8',
          'application/xml;q=1',
        ]);

        assertSome(possibleResponse, response => expect(response).toHaveProperty('mediaType', 'application/xml'));
      });
    });

    describe('when available content types has a non standard parameter', () => {
      it('should return an unparametrised version', () => {
        assertSome(
          findBestHttpContentByMediaType(
            [{ id: faker.random.word(), mediaType: 'application/json; version=1' }],
            ['application/json']
          )
        );
      });
    });

    describe('when available content types has the Q and a non standard parameter', () => {
      it('should return an unparametrised version', () => {
        assertSome(
          findBestHttpContentByMediaType(
            [{ id: faker.random.word(), mediaType: 'application/json; version=1; q=0.6' }],
            ['application/json']
          )
        );
      });

      describe('multiple media types available', () => {
        it('will still give preference with the q parameter', () => {
          assertSome(
            findBestHttpContentByMediaType(
              [
                { id: faker.random.word(), mediaType: 'application/json; version=1; q=1' },
                { id: faker.random.word(), mediaType: 'application/xml; version=1; q=0.6' },
                { id: faker.random.word(), mediaType: 'application/vnd+json; version=1; q=0.5' },
              ],
              ['application/json', 'application/xml']
            ),
            mt => expect(mt).toHaveProperty('mediaType', 'application/json; version=1; q=1')
          );
        });
      });
    });

    describe('when requested content type has a parameter', () => {
      it('should return an unparametrised version', () => {
        assertSome(
          findBestHttpContentByMediaType(
            [{ id: faker.random.word(), mediaType: 'application/json' }],
            ['application/json; version=1']
          )
        );
      });
    });
  });
});
