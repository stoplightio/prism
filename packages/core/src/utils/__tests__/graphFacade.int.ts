import { FilesystemNodeType } from '@stoplight/graphite/backends/filesystem';
import { isAbsolute, resolve } from 'path';
import { GraphFacade } from '../graphFacade';

describe('graphFacade', () => {
  const graphFacade = new GraphFacade();

  describe('createFilesystemNode()', () => {
    test('handles spec given by absolute path', async () => {
      const path = resolve('examples/petstore.oas2.json');
      expect(isAbsolute(path)).toBe(true);

      await graphFacade.createFilesystemNode(path);

      expect(graphFacade.httpOperations.length).toBeGreaterThan(0);
    });
  });

  describe('createRawNode()', () => {
    test('httpOperations should return filtered nodes', async () => {
      const path = '../../../../http/src/__tests__/fixtures/no-refs-petstore.oas2.json';
      await graphFacade.createRawNode(JSON.stringify(require(path)), {
        type: FilesystemNodeType.File,
        path: require.resolve(path),
      });

      expect(graphFacade.httpOperations.length).toBeGreaterThan(0);
    });
  });
});
