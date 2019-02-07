import { FilesystemLoader } from '../../../../src';
jest.mock('../../../../src/utils/graphFacade');
import { GraphFacade } from '../../../../src/utils/graphFacade';

describe('filesystemLoader', () => {
  const fakeHttpOperations = ['a', 'b', 'c'];
  let graphFacadeMock: any;
  let createFileSystemNodeMock: any;

  beforeEach(() => {
    graphFacadeMock = new GraphFacade();
    createFileSystemNodeMock = graphFacadeMock.createFilesystemNode as jest.Mock;
    createFileSystemNodeMock.mockResolvedValue(true);
    Object.defineProperty(graphFacadeMock, 'httpOperations', {
      get: jest.fn().mockReturnValue(fakeHttpOperations),
    });
  });

  test('given no opts should delegate to graph facade for http operations', async () => {
    const filesystemLoader = new FilesystemLoader(graphFacadeMock);

    const operations = await filesystemLoader.load();

    expect(createFileSystemNodeMock).toHaveBeenCalledWith('.');
    expect(operations).toBe(fakeHttpOperations);
  });

  test('given opts should delegate to graph facade for http operations', async () => {
    const filesystemLoader = new FilesystemLoader(graphFacadeMock);

    const operations = await filesystemLoader.load({ path: 'a path' });

    expect(createFileSystemNodeMock).toHaveBeenCalledWith('a path');
    expect(operations).toBe(fakeHttpOperations);
  });
});
