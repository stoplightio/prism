import { ISourceNodeInstance, IVirtualNodeInstance, NodeCategory } from '../nodes';
export declare function isSourceNode(node: {
    category: NodeCategory;
}): node is ISourceNodeInstance;
export declare function isVirtualNode(node: {
    category: NodeCategory;
}): node is IVirtualNodeInstance;
export declare function isRootNode(node: {
    parent: any;
}): boolean;
export declare function isChild(node: {
    parent: any;
}): boolean;
