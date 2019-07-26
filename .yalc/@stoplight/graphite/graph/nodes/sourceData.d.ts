import { IDiagnostic, Optional } from '@stoplight/types';
import { EOL } from '../../backends/filesystem';
import { ISourceNodeData } from './types';
export declare class SourceNodeData implements ISourceNodeData {
    private _raw;
    private _original;
    raw: string | undefined;
    original: string | undefined;
    readonly isDirty: boolean;
    parsed: Optional<any>;
    ast: Optional<object>;
    lineMap: Optional<unknown>;
    resolved: Optional<any>;
    refMap: Optional<any>;
    eol: Optional<EOL>;
    diagnostics: IDiagnostic[];
    constructor(props?: Partial<ISourceNodeData>);
    dehydrate(): {
        raw: string | undefined;
        parsed: any;
        diagnostics: IDiagnostic[];
        isDirty: boolean;
    };
}
