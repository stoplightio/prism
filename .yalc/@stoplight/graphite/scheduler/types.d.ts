import { Resolver } from '@stoplight/json-ref-resolver';
import { IDisposable } from '@stoplight/lifecycle';
import { IDiagnostic } from '@stoplight/types';
import { IPatchableGraph } from '../graph';
import { INodeFinder, JsonPatch } from '../graph/dom';
import { INodeSelector, ISelectableNode, NodeInstance } from '../graph/nodes';
import { ITraceData } from '../types';
export interface IScheduler {
    queue: (task: GraphTask) => Promise<void>;
    queueAll: (tasks: GraphTask[]) => Array<Promise<void>>;
    queueLength: () => number;
    run: (task: GraphTask) => Promise<void>;
    registerHandler: (op: GraphTaskOp, handler: ITaskHandler) => IDisposable;
    drain: () => Promise<any>;
}
export declare enum GraphTaskOp {
    ReadSourceNode = 1,
    WriteSourceNode = 2,
    DeleteSourceNode = 3,
    MoveSourceNode = 4,
    SerializeSourceNode = 5,
    DeserializeSourceNode = 6,
    DiffRawToParsed = 7,
    ComputeSourceMap = 8,
    ResolveSourceNode = 9,
    ValidateSourceNode = 10,
    TransformParsed = 11
}
export declare type GraphTask = IReadSourceNode | IWriteSourceNode | IDeleteSourceNode | IMoveSourceNode | IDeserializeSourceNode | ISerializeSourceNode | IComputeSourceMap | ITransformedParsedData | IResolveSourceNode | IDiagnoseSourceNode;
export declare type GraphTaskResult = GraphTask[] | void;
export declare type TaskRunFunc = (node: NodeInstance, api: ITaskHandlerApi) => Promise<GraphTaskResult> | GraphTaskResult;
export interface ITaskHandler extends INodeSelector {
    id: string;
    selector: (node: ISelectableNode) => boolean;
    run: TaskRunFunc;
}
export interface ITaskHandlerApi extends Omit<IPatchableGraph, 'setSourceNodeDiagnostics'>, INodeFinder {
    task?: GraphTask;
    runTask: (task: GraphTask) => Promise<void>;
    setSourceNodeDiagnostics(id: string, diagnostics: IDiagnostic[], trace?: ITraceData): void;
    resolver: Resolver;
}
export interface ITaskBase {
    op: GraphTaskOp;
    nodeId: string;
    trace?: ITraceData;
}
export interface IReadSourceNode extends ITaskBase {
    op: GraphTaskOp.ReadSourceNode;
}
export interface IWriteSourceNode extends ITaskBase {
    op: GraphTaskOp.WriteSourceNode;
}
export interface IDeleteSourceNode extends ITaskBase {
    op: GraphTaskOp.DeleteSourceNode;
}
export interface IMoveSourceNode extends ITaskBase {
    op: GraphTaskOp.MoveSourceNode;
    newPath?: string;
    newParentId?: string | null;
}
export interface ISerializeSourceNode extends ITaskBase {
    op: GraphTaskOp.SerializeSourceNode;
}
export interface IDeserializeSourceNode extends ITaskBase {
    op: GraphTaskOp.DeserializeSourceNode;
    recomputeOnly?: boolean;
}
export interface ITransformedParsedData extends ITaskBase {
    op: GraphTaskOp.TransformParsed;
    oldValue?: any;
}
export interface IComputeSourceMap extends ITaskBase {
    op: GraphTaskOp.ComputeSourceMap;
    patch?: JsonPatch;
}
export interface IResolveSourceNode extends ITaskBase {
    op: GraphTaskOp.ResolveSourceNode;
    tabu?: string[];
}
export interface IDiagnoseSourceNode extends ITaskBase {
    op: GraphTaskOp.ValidateSourceNode;
}
