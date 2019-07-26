import { INodeTree, INodeUriMap } from './graph/nodes';
import { ISourceNodeMap } from './types';
interface IComputeSourceMapResult {
    uriMap: INodeUriMap;
    nodeTree: INodeTree[];
}
export declare function computeSourceMap(map: ISourceNodeMap[], data: any, parentUri?: string): IComputeSourceMapResult;
export {};
