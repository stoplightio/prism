/// <reference types="node" />
import { IDiagnostic } from '@stoplight/types';
import { INotifier } from '../notifier/types';
import { ITraceData } from '../types';
import { IGraphDom, IGraphPatch, JsonPatch, SourceNodeProp } from './dom';
import { EdgeType } from './edges';
import { INodeTree, NodeInstance, NodeWithOptionalId } from './nodes';
import { IDehydratedGraph, IdGenerator, IdGeneratorWrapper, IGraph, IPatchableGraph } from './types';
export interface IGraphProps {
    id: string;
    idGenerator?: IdGenerator;
    notifier: INotifier;
}
export declare function createGraph(props: IGraphProps): Graph;
declare class Graph implements IGraph {
    id: string;
    dom: IGraphDom;
    private _idGenerator;
    private sourceNodeService;
    notifier: INotifier;
    constructor(props: IGraphProps);
    readonly nodeValues: NodeInstance[];
    readonly sourceNodes: import("./nodes").ISourceNodeInstance<Object>[];
    readonly virtualNodes: import("./nodes").IVirtualNodeInstance[];
    readonly rootNodes: import("./nodes").ISourceNodeInstance<Object>[];
    getNodeById: (id: string) => NodeInstance;
    getNodeByUri: (uri: string) => NodeInstance;
    getNodesByType: (type: string) => NodeInstance[];
    applyPatch(patch: IGraphPatch): import("./dom").IGraphPatchResult<import("./dom").GraphOperationResult<import("./dom").GraphOperation<unknown>>>;
    addNode(node: NodeWithOptionalId, trace?: ITraceData): NodeInstance;
    addEdge(sourceId: string, targetId: string, type: EdgeType, data: unknown, trace?: ITraceData): import("./edges").IEdgeInstance;
    setSourceNodeDiagnostics(id: string, source: string, diagnostics: IDiagnostic[], trace?: ITraceData): void;
    setSourceNodeProp(id: string, prop: SourceNodeProp, value: unknown, trace?: ITraceData): void;
    reportError(nodeId: string, error: NodeJS.ErrnoException, trace?: ITraceData): void;
    patchSourceNodeProp(id: string, prop: SourceNodeProp, value: JsonPatch, trace?: ITraceData): void;
    moveNode(id: string, newParentId?: string | null, newPath?: string, trace?: ITraceData): void;
    removeNode(id: string, trace?: ITraceData): void;
    removeEdge(id: string, trace?: ITraceData): void;
    printTree(): string;
    dehydrate(): IDehydratedGraph;
    dispose(): void;
    private getNodeByPathWithParent;
}
export declare const addNodeTree: ((helpers: Pick<IPatchableGraph, "addNode">, tree: INodeTree[], parentId?: string | undefined) => void) & import("mobx").IAction;
export declare const defaultIdGenerator: IdGeneratorWrapper;
export declare function generateNodeId(node: NodeWithOptionalId, idGenerator: IdGenerator, nodeFinder: Pick<IGraph, 'getNodeById'>): string;
export {};
