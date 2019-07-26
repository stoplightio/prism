import { DisposableCollection, IDisposable } from '@stoplight/lifecycle';
import { Dictionary, IDiagnostic, IParserResult, JsonPath, Optional } from '@stoplight/types';
import { EOL } from '../../backends/filesystem';
import { IEdgeInstance } from '../edges';
import { IHydratable } from '../types';
export declare type Node = ISourceNode | ISourceMapNode | IVirtualNode;
export declare type DehydratedNode = ISourceNode | IDehydratedSourceMapNode | IVirtualNode;
export declare type NodeWithOptionalId = Omit<Node, 'id' | 'language'> & {
    id?: string;
    language?: string;
};
export declare type NodeInstance = ISourceNodeInstance | ISourceMapNodeInstance | IVirtualNodeInstance;
export declare enum NodeCategory {
    Source = 1,
    SourceMap = 2,
    Virtual = 3
}
export interface IBaseNode {
    readonly id: string;
    type: string;
    language?: string;
    path: string;
    readonly parentId?: string;
}
export interface IBaseNodeInstanceMethods<P, C> {
    parent: P;
    readonly uri: string;
    readonly version: string;
    readonly children: C[];
    readonly incomingEdges: IEdgeInstance[];
    readonly outgoingEdges: IEdgeInstance[];
    readonly disposables: DisposableCollection;
    getAncestor: (matcher: (node: Optional<NodeInstance>) => boolean) => NodeInstance | undefined;
}
export interface IBaseNodeInstance<P = NodeInstance, C = P> extends IBaseNode, IBaseNodeInstanceMethods<P, C> {
}
export interface ISelectableNode {
    id: string;
    category: NodeCategory;
    type?: string;
    language?: string;
    spec?: string;
}
export interface INodeSelector {
    selector: (node: ISelectableNode) => boolean;
}
export interface INodeTree extends NodeWithOptionalId {
    children: INodeTree[];
}
export interface INodeUriMap {
    [uri: string]: NodeWithOptionalId;
}
export interface ISourceNode<K = any> extends IBaseNode {
    category: NodeCategory.Source;
    data?: ISourceNodeData & K;
    spec?: string;
}
export interface ISourceNodeInstance<K = Object> extends ISourceNode, IBaseNodeInstanceMethods<Optional<ISourceNodeInstance>, NodeInstance>, IHydratable<ISourceNode>, IDisposable {
    readonly data: ISourceNodeData & K;
}
export declare type ISourceNodeParsed = IParserResult<any, object, Optional<unknown>>;
export interface ISourceNodeData {
    original: Optional<string>;
    raw: Optional<string>;
    eol: Optional<EOL>;
    parsed: ISourceNodeParsed['data'];
    diagnostics: ISourceNodeParsed['diagnostics'];
    ast: Optional<ISourceNodeParsed['ast']>;
    lineMap: ISourceNodeParsed['lineMap'];
    resolved: Optional<unknown>;
    refMap: Optional<Dictionary<string, string>>;
    isDirty?: boolean;
}
export interface ISourceMapNodeData {
    parsed: Optional<any>;
    readonly diagnostics: Optional<IDiagnostic[]>;
    readonly resolved?: unknown;
}
export interface ISourceMapNode extends IBaseNode {
    category: NodeCategory.SourceMap;
    readonly language?: string;
    subtype?: string;
}
export interface IDehydratedSourceMapNode extends ISourceMapNode {
    readonly parentSourceNodeId: string;
    readonly relativeJsonPath: JsonPath;
    readonly data: ISourceMapNodeData;
}
export interface ISourceMapNodeInstance extends ISourceMapNode, IBaseNodeInstanceMethods<ISourceNodeInstance | ISourceMapNodeInstance, ISourceMapNodeInstance | IVirtualNodeInstance>, IHydratable<IDehydratedSourceMapNode>, IDisposable {
    readonly data: ISourceMapNodeData;
    readonly parentSourceNode: ISourceNodeInstance;
    readonly relativeJsonPath: JsonPath;
    readonly spec?: string;
}
export interface IVirtualNode extends IBaseNode {
    category: NodeCategory.Virtual;
    data?: unknown;
}
export interface IVirtualNodeInstance extends IVirtualNode, IBaseNodeInstanceMethods<NodeInstance, ISourceMapNodeInstance | IVirtualNodeInstance>, IHydratable<IVirtualNode>, IDisposable {
}
export declare enum Languages {
    Markdown = "markdown",
    JavaScript = "javascript",
    Json = "json",
    Yaml = "yaml"
}
export declare enum Specs {
    OAS2 = "oas2",
    OAS3 = "oas3",
    Json_Schema = "json_schema",
    Markdown = "md"
}
