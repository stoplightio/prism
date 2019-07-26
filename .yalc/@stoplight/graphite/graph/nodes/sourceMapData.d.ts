import { ISourceMapNodeData, ISourceMapNodeInstance } from './types';
export declare class SourceMapNodeData implements ISourceMapNodeData {
    private sourceMapNode;
    constructor(sourceMapNode: ISourceMapNodeInstance);
    readonly parsed: any;
    readonly diagnostics: {
        path: string[];
        range: import("@stoplight/types").IRange;
        message: string;
        severity: import("@stoplight/types").DiagnosticSeverity;
        source?: string | undefined;
        code?: string | number | undefined;
        tags?: string[] | undefined;
        relatedInformation?: import("@stoplight/types").IDiagnosticRelatedInformation[] | undefined;
    }[];
    readonly resolved: any;
    dehydrate(): {
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
}
