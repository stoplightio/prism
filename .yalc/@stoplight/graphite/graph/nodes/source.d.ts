import { Optional } from '@stoplight/types';
import { BaseNode } from './base';
import { SourceNodeData } from './sourceData';
import { ISelectableNode, ISourceNode, ISourceNodeData, ISourceNodeInstance, NodeCategory, NodeInstance } from './types';
export declare class SourceNode extends BaseNode<Optional<ISourceNodeInstance>, NodeInstance> implements ISourceNodeInstance, ISelectableNode {
    readonly category = NodeCategory.Source;
    private _spec?;
    spec: string | undefined;
    readonly data: SourceNodeData;
    constructor(props: Omit<ISourceNode, 'category' | 'data'> & {
        data?: Partial<ISourceNodeData>;
    }, parent?: ISourceNodeInstance);
    dehydrate(): {
        id: string;
        category: NodeCategory.Source;
        type: string;
        language: string | undefined;
        path: string;
        uri: string;
        parentId: string | undefined;
        data: {
            raw: string | undefined;
            parsed: any;
            diagnostics: import("@stoplight/types").IDiagnostic[];
            isDirty: boolean;
        };
        spec: string | undefined;
    };
}
