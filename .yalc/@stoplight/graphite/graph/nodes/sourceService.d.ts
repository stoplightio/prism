import { IGraph } from '../types';
import { ISourceNodeInstance } from './types';
export declare class SourceNodeService {
    private graph;
    constructor(graph: IGraph);
    observeSpec(node: ISourceNodeInstance): import("@stoplight/lifecycle").IDisposable[] | undefined;
    private reactToParsedChange;
    private reactToPathChange;
    private setSpec;
}
