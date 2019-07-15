import * as utils from '@stoplight/graphite/backends/filesystem/utils';
import { GraphFacade } from '../graphFacade';

describe('graphFacade', () => {
  const graphFacade = new GraphFacade();
  describe('createRawNode()', () => {
    describe('url parameter', () => {
      describe('with querystring', () => {
        beforeAll(() => jest.spyOn(utils, 'filenameToLanguage'));
        afterAll(() => jest.restoreAllMocks());
        it('should strip the querystring when calling the fileNameToLanguage', async () => {
          await graphFacade.createRawNode('', { type: 'test', path: 'https://test.com/file.yml?q=10' });
          expect(utils.filenameToLanguage).toHaveBeenCalledWith('/file.yml');
        });
      });
    });
  });
});
