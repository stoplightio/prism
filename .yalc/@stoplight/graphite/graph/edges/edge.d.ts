import { NodeInstance } from '../nodes';
import { EdgeType, IEdge, IEdgeInstance } from './types';
export declare function createEdge(props: IEdge): Edge;
declare class Edge implements IEdgeInstance {
    readonly id: string;
    readonly type: EdgeType;
    readonly data: unknown;
    private _source;
    private _target;
    constructor(props: IEdge);
    source: NodeInstance;
    readonly sourceId: string | undefined;
    target: NodeInstance;
    readonly targetId: string | undefined;
    dehydrate(): {
        id: string;
        sourceId: string | undefined;
        targetId: string | undefined;
        data: unknown;
    };
    dispose(): void;
}
export {};
