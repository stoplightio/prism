/// <reference types="node" />
import { Stats } from 'fs';
import { ISourceNode } from '../../graph/nodes';
export interface IFilesystemOpts {
    fs: any;
}
export declare enum FilesystemNodeType {
    File = "file",
    Directory = "directory"
}
export interface IFileNode extends ISourceNode {
    type: FilesystemNodeType.File;
    stats?: Stats;
}
export interface IDirectoryNode extends ISourceNode {
    type: FilesystemNodeType.Directory;
    stats?: Stats;
}
export declare enum EOL {
    LF = "\n",
    CRLF = "\r\n"
}
