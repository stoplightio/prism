/// <reference types="node" />
import { IDisposable } from '@stoplight/lifecycle';
import { Dictionary, IDiagnostic } from '@stoplight/types';
import { INotifier } from '../notifier';
import { ITraceData } from '../types';
import { IGraphDom, IGraphPatch, IGraphPatchResult, INodeFinder, JsonPatch, SourceNodeProp } from './dom/types';
import { EdgeInstance, EdgeType } from './edges/types';
import { IBaseNode, ISourceNodeInstance, IVirtualNodeInstance, NodeInstance, NodeWithOptionalId } from './nodes/types';
export interface IGraph<N = NodeInstance, E = EdgeInstance> extends IDisposable, INodeFinder, IPatchableGraph, IHydratable<IDehydratedGraph> {
    readonly dom: IGraphDom<N, E>;
    readonly nodeValues: NodeInstance[];
    readonly sourceNodes: ISourceNodeInstance[];
    readonly virtualNodes: IVirtualNodeInstance[];
    readonly rootNodes: ISourceNodeInstance[];
    readonly notifier: INotifier;
    printTree: () => string;
}
export interface IPatchableGraph {
    applyPatch: (patch: IGraphPatch) => IGraphPatchResult;
    addNode: <NodeType extends NodeWithOptionalId>(props: NodeType, trace?: ITraceData) => NodeInstance;
    setSourceNodeDiagnostics: (id: string, source: string, value: IDiagnostic[], trace?: ITraceData) => void;
    setSourceNodeProp: (id: string, prop: SourceNodeProp, value: unknown, trace?: ITraceData) => void;
    patchSourceNodeProp: (id: string, prop: SourceNodeProp, patch: JsonPatch, trace?: ITraceData) => void;
    moveNode: (id: string, newParentId?: string | null, newPath?: string, trace?: ITraceData) => void;
    removeNode: (id: string, trace?: ITraceData) => void;
    reportError: (nodeId: string, err: NodeJS.ErrnoException, trace?: ITraceData) => void;
    addEdge: (sourceId: string, targetId: string, type: EdgeType, data?: unknown, trace?: ITraceData) => EdgeInstance;
    removeEdge: (id: string, trace?: ITraceData) => void;
}
export interface IHydratable<D = unknown> {
    dehydrate: () => D;
}
export interface IDehydratedGraph {
    nodes: Dictionary<IBaseNode, string>;
}
export declare type IdGeneratorWrapper = (node: NodeWithOptionalId) => string;
export declare type IdGenerator = (node: NodeWithOptionalId, uri: string) => string;
