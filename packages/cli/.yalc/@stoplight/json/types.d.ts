import { IParserResult, IRange } from '@stoplight/types';
import { Node, NodeType, ParseOptions } from 'jsonc-parser';
export interface IJsonASTNode extends Node {
    type: NodeType;
    value?: any;
    offset: number;
    length: number;
    range?: IRange;
    colonOffset?: number;
    parent?: IJsonASTNode;
    children?: IJsonASTNode[];
}
export interface IParseOptions extends ParseOptions {
    ignoreDuplicateKeys?: boolean;
    preserveKeyOrder?: boolean;
}
export declare type JsonParserResult<T> = IParserResult<T, IJsonASTNode, number[]>;
