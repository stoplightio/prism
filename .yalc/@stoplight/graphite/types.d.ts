import { IDisposable } from '@stoplight/lifecycle';
import { Dictionary, IParserResult } from '@stoplight/types';
import { IGraph } from './graph';
import { JsonPatch } from './graph/dom';
import { IEdge } from './graph/edges';
import { INodeSelector, Node } from './graph/nodes';
import { INotifier } from './notifier';
import { GraphTaskOp, IScheduler } from './scheduler';
import { TaskHandler } from './scheduler/taskHandler';
export interface IGraphite extends IDisposable {
    readonly graph: IGraph;
    readonly notifier: INotifier;
    readonly scheduler: IScheduler;
    registerPlugins: (...plugins: IGraphitePlugin[]) => IDisposable;
}
export declare type SourceBackendFactory = (graph: IGraphite, ...args: any) => ISourceBackend;
export interface ISourceBackend {
    id: string;
}
export interface IPluginTask {
    operation: GraphTaskOp;
    handler: TaskHandler;
}
export interface IGraphitePlugin {
    tasks: IPluginTask[];
    specProvider?: ISpecProvider;
}
export interface ISpecProvider {
    spec: string;
    path: RegExp;
    content?: (parsed: any) => number;
}
export interface IParser extends INodeSelector {
    serialize: SerializeFunc;
    deserialize: DeserializeFunc;
}
export declare type SerializeFunc = (parsed: any) => string;
export declare type DeserializeFunc = (raw: string) => IParserResult;
export interface ISourceMapPlugin extends INodeSelector {
    map: ISourceNodeMap[];
}
export interface ISourceNodeMap {
    type: string;
    noAdd?: boolean;
    subtype?: string;
    field?: string;
    match?: string;
    notMatch?: string;
    children?: ISourceNodeMap[];
}
export declare enum DiffOp {
    AddNode = "add_node",
    ModifyNode = "modify_node",
    RemoveNode = "remove_node",
    AddEdge = "add_edge",
    ModifyEdge = "modify_edge",
    RemoveEdge = "remove_edge"
}
export interface IGraphDiff {
    [DiffOp.AddNode]: Dictionary<Node, string>;
    [DiffOp.ModifyNode]: Dictionary<JsonPatch, string>;
    [DiffOp.RemoveNode]: Dictionary<Node, string>;
    [DiffOp.AddEdge]: Dictionary<IEdge, string>;
    [DiffOp.ModifyEdge]: Dictionary<JsonPatch, string>;
    [DiffOp.RemoveEdge]: Dictionary<IEdge, string>;
}
export interface ITraceData {
    instanceId?: string;
    sourceOp?: GraphTaskOp;
}
export declare type GraphiteError = IPluginError | IGenericError | IUnhandledError;
export declare enum GraphiteErrorCode {
    Plugin = 1,
    Unhandled = 2,
    Generic = 3
}
interface IGraphiteError<D> {
    code: GraphiteErrorCode;
    message: string;
    nodeId?: string;
    trace?: ITraceData;
    data?: D;
}
export interface IUnhandledError<D = unknown> extends IGraphiteError<D> {
    code: GraphiteErrorCode.Unhandled;
}
export interface IGenericError<D = unknown> extends IGraphiteError<D> {
    code: GraphiteErrorCode.Generic;
}
export interface IPluginError<D = unknown> extends IGraphiteError<D> {
    code: GraphiteErrorCode.Plugin;
    nodeId: string;
    trace: ITraceData;
}
export {};
