import { DisposableCollection } from '@stoplight/lifecycle';
import { Optional } from '@stoplight/types';
import { IBaseNode, IBaseNodeInstance, NodeInstance } from './types';
export declare class BaseNode<TParent extends Optional<NodeInstance>, TChildren extends NodeInstance> implements IBaseNodeInstance<TParent, TChildren> {
    readonly id: string;
    type: string;
    disposables: DisposableCollection;
    private _language?;
    protected _path: string;
    children: TChildren[];
    incomingEdges: never[];
    outgoingEdges: never[];
    private _parent;
    protected static assertPath(parent: Optional<NodeInstance>, path: string): void;
    constructor(props: IBaseNode, parent: TParent);
    language: string | undefined;
    path: string;
    parent: TParent;
    readonly parentId: string | undefined;
    readonly uri: string;
    readonly version: string;
    getAncestor(matcher: (node: Optional<NodeInstance>) => boolean): import("./types").ISourceNodeInstance<Object> | import("./types").ISourceMapNodeInstance | import("./types").IVirtualNodeInstance | TParent | undefined;
    removeEdges(): void;
    dispose(): void;
}
