import { IDisposable, IEventEmitter } from '@stoplight/lifecycle';
import { GraphOperationResult, IAddEdgeOperation, IAddNodeOperation, IGraphPatchResult, IMoveNodeOperation, IPatchEdgeDataOperation, IPatchSourceNodePropOperation, IRemoveEdgeOperation, IRemoveNodeOperation, ISetSourceNodePropOperation } from '../graph/dom';
import { Node } from '../graph/nodes';
import { GraphiteError, ITraceData } from '../types';
export interface INotifier extends IDisposable, GraphiteEmitter {
}
export declare type GraphiteEmitter = IEventEmitter<IGraphiteEvents>;
export declare enum GraphiteEvent {
    DidPatch = 1,
    DidAddNode = 2,
    DidMoveNode = 3,
    DidRemoveNode = 4,
    DidChangeSourceNode = 5,
    DidSetSourceNodeProp = 6,
    DidPatchSourceNodeProp = 7,
    DidUpdateNodeUri = 8,
    DidUpdateSourceMapNodeData = 9,
    DidUpdateSourceMapNodeResolved = 10,
    DidAddEdge = 11,
    DidRemoveEdge = 12,
    DidPatchEdgeData = 13,
    DidError = 14,
    DidPatchSourceNodePropComplete = 15
}
export interface INodeChange {
    node: Node;
    change: ISetSourceNodePropOperation | IPatchSourceNodePropOperation;
}
export interface IGraphiteEvents {
    [GraphiteEvent.DidPatch]: (patch: IGraphPatchResult) => void;
    [GraphiteEvent.DidAddNode]: (result: GraphOperationResult<IAddNodeOperation>) => void;
    [GraphiteEvent.DidMoveNode]: (result: GraphOperationResult<IMoveNodeOperation>) => void;
    [GraphiteEvent.DidRemoveNode]: (result: GraphOperationResult<IRemoveNodeOperation>) => void;
    [GraphiteEvent.DidChangeSourceNode]: (result: INodeChange) => void;
    [GraphiteEvent.DidSetSourceNodeProp]: (result: GraphOperationResult<ISetSourceNodePropOperation>) => void;
    [GraphiteEvent.DidPatchSourceNodeProp]: (result: GraphOperationResult<IPatchSourceNodePropOperation>) => void;
    [GraphiteEvent.DidPatchSourceNodePropComplete]: (result: GraphOperationResult<IPatchSourceNodePropOperation | ISetSourceNodePropOperation>) => void;
    [GraphiteEvent.DidUpdateNodeUri]: (result: {
        id: string;
        oldUri?: string;
        newUri: string;
    }) => void;
    [GraphiteEvent.DidUpdateSourceMapNodeData]: (result: {
        id: string;
        oldValue?: any;
        newValue: any;
        trace?: ITraceData;
    }) => void;
    [GraphiteEvent.DidUpdateSourceMapNodeResolved]: (result: {
        id: string;
        oldValue?: any;
        newValue: any;
        trace?: ITraceData;
    }) => void;
    [GraphiteEvent.DidAddEdge]: (result: GraphOperationResult<IAddEdgeOperation>) => void;
    [GraphiteEvent.DidRemoveEdge]: (result: GraphOperationResult<IRemoveEdgeOperation>) => void;
    [GraphiteEvent.DidPatchEdgeData]: (result: GraphOperationResult<IPatchEdgeDataOperation>) => void;
    [GraphiteEvent.DidError]: (result: {
        error: GraphiteError;
    }) => void;
}
