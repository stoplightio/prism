/// <reference types="node" />
import * as nodefs from 'fs';
import { IGraphite } from '../../types';
interface IFileSystem {
    unlink: typeof nodefs.unlink;
    rename: typeof nodefs.rename;
    readdir: typeof nodefs.readdir;
    stat: typeof nodefs.stat;
    rmdir: typeof nodefs.rmdir;
    readFile: typeof nodefs.readFile;
    writeFile: typeof nodefs.writeFile;
    mkdir: typeof nodefs.mkdir;
}
export declare const createFileSystemBackend: (graphite: IGraphite, fs: IFileSystem) => FileSystemBackend;
export declare class FileSystemBackend {
    private graphite;
    readonly id = "fs";
    private readonly fs;
    constructor(graphite: IGraphite, fs: IFileSystem);
    readdir(uri: string): void;
    readFile(uri: string): void;
    indexTree(uri: string, parentId?: string): Promise<void>;
    remove(id: string): Promise<void>;
    private readNodeByUri;
    private deleteDirectoryRecursive;
    private handleReadDirectoryNode;
    private handleReadFileSourceNode;
    private handleWriteFileSourceNode;
    private handleRemoveSourceNode;
    private handleMoveSourceNode;
}
export {};
