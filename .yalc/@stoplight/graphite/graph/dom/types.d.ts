import { Dictionary, IDiagnostic, JsonPath, Optional } from '@stoplight/types';
import { ITraceData } from '../../types';
import { EdgeInstance, EdgeType } from '../edges';
import { ISourceNodeInstance, Node, NodeInstance } from '../nodes';
export interface IGraphDom<N = NodeInstance, E = EdgeInstance> {
    nodes: Dictionary<N, string>;
    edges: Dictionary<E, string>;
    nodesByUri: Dictionary<N, string>;
    nodesByType: Dictionary<N[], string>;
}
export interface INodeFinder {
    getNodeById(id: string): Optional<NodeInstance>;
    getNodeByUri(uri: string): Optional<NodeInstance>;
    getNodesByType(type: string): NodeInstance[];
}
export interface IGraphPatch<D extends GraphOperation = GraphOperation> {
    operations: D[];
    trace: ITraceData;
}
export interface IGraphPatchResult<D extends GraphOperationResult = GraphOperationResult> {
    operations: D[];
    trace: ITraceData;
}
export declare type JsonPatch<D extends JsonOperation = JsonOperation> = D[];
export declare type JsonPatchResult<D extends JsonOperationResult = JsonOperationResult> = D[];
export interface IReversableGraphPatch<D extends JsonOperation = JsonOperation, I = D> {
    data: D[];
    inverse: I[];
}
export declare type GraphOrJsonOperation = GraphOperation | JsonOperation;
export declare type GraphOrJsonOperationResult = GraphOperationResult | JsonOperationResult;
export interface IOperationResult {
    previousValue?: any;
    error?: Error;
}
export declare enum GraphOp {
    AddNode = 1,
    MoveNode = 2,
    RemoveNode = 3,
    SetSourceNodeDiagnostics = 4,
    SetSourceNodeProp = 5,
    PatchSourceNodeProp = 6,
    AddEdge = 7,
    RemoveEdge = 8,
    PatchEdgeData = 9
}
export declare type GraphOperation<D = unknown> = IAddNodeOperation | IMoveNodeOperation | IRemoveNodeOperation | ISetSourceNodeDiagnosticsOperation | ISetSourceNodePropOperation | IPatchSourceNodePropOperation | IAddEdgeOperation<D> | IRemoveEdgeOperation | IPatchEdgeDataOperation;
export declare type GraphOperationResult<O extends GraphOperation = GraphOperation> = O & IOperationResult;
export interface IBaseOperation {
    trace?: ITraceData;
}
export interface IAddNodeOperation extends IBaseOperation {
    op: GraphOp.AddNode;
    node: Node;
}
export interface IMoveNodeOperation extends IBaseOperation {
    op: GraphOp.MoveNode;
    id: string;
    newParentId?: string | null;
    newPath?: string;
}
export interface IRemoveNodeOperation extends IBaseOperation {
    op: GraphOp.RemoveNode;
    id: string;
}
export declare type SourceNodeProp = keyof Pick<ISourceNodeInstance, 'spec'> | 'data' | 'data.raw' | 'data.parsed' | 'data.original' | 'data.resolved' | 'data.eol' | 'data.diagnostics' | 'data.ast' | 'data.lineMap' | 'data.refMap';
export interface ISetSourceNodeDiagnosticsOperation extends IBaseOperation {
    op: GraphOp.SetSourceNodeDiagnostics;
    id: string;
    source: string;
    diagnostics: IDiagnostic[];
}
export interface ISetSourceNodePropOperation extends IBaseOperation {
    op: GraphOp.SetSourceNodeProp;
    id: string;
    prop: SourceNodeProp;
    value: unknown;
}
export interface IPatchSourceNodePropOperation extends IBaseOperation {
    op: GraphOp.PatchSourceNodeProp;
    id: string;
    prop: SourceNodeProp;
    value: JsonPatch;
}
export interface IAddEdgeOperation<D = unknown> extends IBaseOperation {
    op: GraphOp.AddEdge;
    id: string;
    type: EdgeType;
    sourceId: string;
    targetId: string;
    data?: D;
}
export interface IRemoveEdgeOperation extends IBaseOperation {
    op: GraphOp.RemoveEdge;
    id: string;
}
export interface IPatchEdgeDataOperation extends IBaseOperation {
    op: GraphOp.PatchEdgeData;
    id: string;
    patch: JsonPatch;
}
export declare enum JsonOp {
    Add = "add",
    Remove = "remove",
    Replace = "replace",
    Move = "move",
    Copy = "copy",
    Test = "test",
    Text = "text"
}
export declare type JsonOperation<D = unknown> = IAddOperation<D> | IRemoveOperation | IReplaceOperation<D> | IMoveOperation | ICopyOperation | ITestOperation<D> | ITextOperation;
export declare type JsonOperationResult<D = unknown> = JsonOperation<D> & IOperationResult;
export interface IAddOperation<D = unknown> {
    op: JsonOp.Add;
    path: JsonPath;
    value: D;
}
export interface IRemoveOperation {
    op: JsonOp.Remove;
    path: JsonPath;
}
export interface IReplaceOperation<D = unknown> {
    op: JsonOp.Replace;
    path: JsonPath;
    value: D;
}
export interface IMoveOperation {
    op: JsonOp.Move;
    path: JsonPath;
    from: JsonPath;
}
export interface ICopyOperation {
    op: JsonOp.Copy;
    path: JsonPath;
    from: JsonPath;
}
export interface ITestOperation<D = unknown> {
    op: JsonOp.Test;
    path: JsonPath;
    value: D;
}
export interface ITextOperation {
    op: JsonOp.Text;
    value: string;
    offset: number;
    length: number;
}
