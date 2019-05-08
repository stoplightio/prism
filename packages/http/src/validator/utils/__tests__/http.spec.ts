import { resolveContent } from '../http';

describe('resolveContent()', () => {
  describe('mediaType not provided', () => {
    it('returns default content', () => {
      expect(
        resolveContent({
          '*': { mediaType: '*', examples: [], encodings: [] },
          'application/exists-son': {
            mediaType: 'application/exists-son',
            examples: [],
            encodings: [],
          },
        }),
      ).toMatchSnapshot();
    });
  });

  describe('mediaType provided', () => {
    describe('specific content exists', () => {
      it('returns specific content', () => {
        expect(
          resolveContent(
            {
              '*': { mediaType: '*', examples: [], encodings: [] },
              'application/exists-son': {
                mediaType: 'application/exists-son',
                examples: [],
                encodings: [],
              },
            },
            'application/exists-son',
          ),
        ).toMatchSnapshot();
      });
    });

    describe('specific content does not exist', () => {
      it('returns default content', () => {
        expect(
          resolveContent(
            {
              '*': { mediaType: '*', examples: [], encodings: [] },
              'application/exists-son': {
                mediaType: 'application/exists-son',
                examples: [],
                encodings: [],
              },
            },
            'application/non-exists-son',
          ),
        ).toMatchSnapshot();
      });
    });
  });
});
