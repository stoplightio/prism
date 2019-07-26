import { BaseNode } from './base';
import { ISelectableNode, ISourceMapNodeInstance, IVirtualNode, IVirtualNodeInstance, NodeCategory, NodeInstance } from './types';
export declare class VirtualNode<D = any> extends BaseNode<NodeInstance, ISourceMapNodeInstance | IVirtualNodeInstance> implements IVirtualNodeInstance, ISelectableNode {
    readonly category = NodeCategory.Virtual;
    readonly data: D;
    constructor(props: Omit<IVirtualNode, 'category'>, parent: NodeInstance);
    readonly parentId: string;
    dehydrate(): {
        id: string;
        category: NodeCategory.Virtual;
        type: string;
        language: string | undefined;
        path: string;
        uri: string;
        parentId: string;
        data: D;
    };
}
