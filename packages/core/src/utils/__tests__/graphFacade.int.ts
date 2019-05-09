import { isAbsolute, resolve } from 'path';
import { GraphFacade } from '../graphFacade';

describe('graphFacade', () => {
  const graphFacade = new GraphFacade();

  describe('createFilesystemNode()', () => {
    test('httpOperations should return filtered nodes', async () => {
      await graphFacade.createFilesystemNode('examples/petstore.oas2.json');

      expect(graphFacade.httpOperations).toMatchSnapshot();
    });

    test('handles spec given by absolute path', async () => {
      const path = resolve('examples/petstore.oas2.json');
      expect(isAbsolute(path)).toBe(true);

      await graphFacade.createFilesystemNode(path);

      expect(graphFacade.httpOperations.length).toBeGreaterThan(0);
    });
  });
});
