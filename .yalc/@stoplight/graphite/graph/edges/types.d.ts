import { IDisposable } from '@stoplight/lifecycle';
import { IGraphDom } from '../dom';
import { NodeInstance } from '../nodes';
import { IHydratable } from '../types';
export declare const enum EdgeType {
    RefersTo = 1,
    Generic = 99
}
export interface IBaseEdge {
    id: string;
    data?: unknown;
    readonly sourceId?: string;
    readonly targetId?: string;
}
export interface IEdge extends IBaseEdge {
    source: NodeInstance;
    target: NodeInstance;
    type: EdgeType;
}
export interface IEdgeInstance extends Readonly<IEdge>, IHydratable<IBaseEdge>, IDisposable {
}
export interface IEdgeGraphProps {
    dom: IGraphDom;
}
export declare type Edge = IEdge;
export declare type EdgeWithOptionalId = Omit<Edge, 'id'> & {
    id?: string;
};
export declare type EdgeInstance = IEdgeInstance;
