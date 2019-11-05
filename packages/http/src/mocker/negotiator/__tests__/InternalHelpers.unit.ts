import { assertSome } from '@stoplight/prism-core/src/__tests__/utils';
import { findBestHttpContentByMediaType } from '../InternalHelpers';

describe('InternalHelpers', () => {
  describe('findBestHttpContentByMediaType', () => {
    describe('with multiple content types for a response', () => {
      const avaiableResponses = {
        code: '200',
        contents: [{ mediaType: 'application/xml' }, { mediaType: 'application/json' }],
      };

      it('should respect the q parameter', () => {
        const possibleResponse = findBestHttpContentByMediaType(avaiableResponses, [
          'application/json;q=0.8',
          'application/xml;q=1',
        ]);

        assertSome(possibleResponse, response => expect(response).toHaveProperty('mediaType', 'application/xml'));
      });
    });
  });
});
