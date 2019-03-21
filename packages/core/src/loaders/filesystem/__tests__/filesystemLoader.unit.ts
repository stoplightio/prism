import * as fs from 'fs';
import { FilesystemLoader } from '../';
import { GraphFacade } from '../../../utils/graphFacade';
jest.mock('../../../utils/graphFacade');
jest.mock('fs');

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
    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true);
    jest.spyOn(fs, 'statSync').mockReturnValueOnce({ isDirectory: () => false });
    const filesystemLoader = new FilesystemLoader(graphFacadeMock);

    const operations = await filesystemLoader.load();

    expect(createFileSystemNodeMock).toHaveBeenCalledWith('.');
    expect(operations).toBe(fakeHttpOperations);
  });

  test('given opts should delegate to graph facade for http operations', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true);
    jest.spyOn(fs, 'statSync').mockReturnValueOnce({ isDirectory: () => false });

    const filesystemLoader = new FilesystemLoader(graphFacadeMock);

    const operations = await filesystemLoader.load({ path: 'a path' });

    expect(createFileSystemNodeMock).toHaveBeenCalledWith('a path');
    expect(operations).toBe(fakeHttpOperations);
  });

  it('throws error when supplied with non-existing path', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true);
    jest.spyOn(fs, 'statSync').mockReturnValueOnce({ isDirectory: () => true });
    const filesystemLoader = new FilesystemLoader(graphFacadeMock);
    return expect(filesystemLoader.load({ path: 'a path' })).rejects.toThrowErrorMatchingSnapshot();
  });

  it('throws error when supplied with a directory', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(false);
    const filesystemLoader = new FilesystemLoader(graphFacadeMock);
    return expect(filesystemLoader.load({ path: 'a path' })).rejects.toThrowErrorMatchingSnapshot();
  });
});
