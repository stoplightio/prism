import { BaseNode } from './base';
import { SourceMapNodeData } from './sourceMapData';
import { IBaseNode, ISelectableNode, ISourceMapNodeInstance, ISourceNodeInstance, IVirtualNodeInstance, NodeCategory } from './types';
export declare class SourceMapNode extends BaseNode<ISourceNodeInstance | ISourceMapNodeInstance, ISourceMapNodeInstance | IVirtualNodeInstance> implements ISourceMapNodeInstance, ISelectableNode {
    readonly category = NodeCategory.SourceMap;
    readonly data: SourceMapNodeData;
    subtype?: string;
    constructor(props: IBaseNode & {
        subtype?: string;
    }, parent: ISourceNodeInstance | ISourceMapNodeInstance);
    readonly parentId: string;
    readonly parentSourceNode: ISourceNodeInstance<Object>;
    readonly spec: string | undefined;
    readonly relativeJsonPath: import("@stoplight/types").Segment[];
    readonly language: string | undefined;
    dehydrate(): {
        id: string;
        category: NodeCategory.SourceMap;
        type: string;
        subtype: string | undefined;
        path: string;
        uri: string;
        parentId: string;
        spec: string | undefined;
        language: string | undefined;
        parentSourceNodeId: string;
        relativeJsonPath: import("@stoplight/types").Segment[];
        data: {
            parsed: any;
            diagnostics: {
                path: string[];
                range: import("@stoplight/types").IRange;
                message: string;
                severity: import("@stoplight/types").DiagnosticSeverity;
                source?: string | undefined;
                code?: string | number | undefined;
                tags?: string[] | undefined;
                relatedInformation?: import("@stoplight/types").IDiagnosticRelatedInformation[] | undefined;
            }[];
        };
    };
}
