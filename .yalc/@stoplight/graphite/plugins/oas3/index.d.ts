import { INodeSelector } from '../../graph';
import { IGraphitePlugin, ISourceMapPlugin } from '../../types';
export * from './types';
export declare const oas3NodeSelector: INodeSelector['selector'];
export declare const oas3OperationSelector: INodeSelector['selector'];
export declare function createOas3Plugin(sourceMapPlugin?: ISourceMapPlugin): IGraphitePlugin;
