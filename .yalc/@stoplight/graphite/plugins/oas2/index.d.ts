import { INodeSelector } from '../../graph';
import { IGraphitePlugin, ISourceMapPlugin } from '../../types';
export * from './types';
export declare const oas2NodeSelector: INodeSelector['selector'];
export declare const oas2OperationSelector: INodeSelector['selector'];
export declare function createOas2Plugin(sourceMapPlugin?: ISourceMapPlugin): IGraphitePlugin;
