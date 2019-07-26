import { EdgeInstance } from '../edges';
import { NodeCategory } from '../nodes/types';
interface IPrintableNode {
    category: NodeCategory;
    type: string;
    subtype?: string;
    language?: string;
    path: string;
    children?: IPrintableNode[];
    incomingEdges?: EdgeInstance[];
    outgoingEdges?: EdgeInstance[];
}
export declare const printTree: (nodes: IPrintableNode | IPrintableNode[], relative?: boolean) => string;
export {};
