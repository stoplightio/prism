import { FilesystemNodeType } from '@stoplight/graphite/backends/filesystem';
import { isAbsolute, resolve } from 'path';
import { GraphFacade } from '../graphFacade';

describe('graphFacade', () => {
  const graphFacade = new GraphFacade();

  describe('createFilesystemNode()', () => {
    test('httpOperations should return filtered nodes', async () => {
      await graphFacade.createFilesystemNode('packages/cli/src/samples/no-refs-petstore.oas2.json');

      expect(graphFacade.httpOperations).toMatchSnapshot();
    });

    test('handles spec given by absolute path', async () => {
      const path = resolve('packages/cli/src/samples/no-refs-petstore.oas2.json');
      expect(isAbsolute(path)).toBe(true);

      await graphFacade.createFilesystemNode(path);

      expect(graphFacade.httpOperations.length).toBeGreaterThan(0);
    });
  });

  describe('createRawNode()', () => {
    test('httpOperations should return filtered nodes', async () => {
      await graphFacade.createRawNode(
        JSON.stringify(require('../../../../cli/src/samples/no-refs-petstore.oas2.json')),
        { type: FilesystemNodeType.File, subtype: 'json' }
      );

      expect(graphFacade.httpOperations.length).toBeGreaterThan(0);
    });
  });
});
