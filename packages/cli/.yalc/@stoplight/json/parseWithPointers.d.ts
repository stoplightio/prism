import { IDiagnostic, IParserASTResult } from '@stoplight/types';
import { IJsonASTNode, IParseOptions, JsonParserResult } from './types';
export declare const parseWithPointers: <T = any>(value: string, options?: IParseOptions) => JsonParserResult<T>;
export declare function parseTree<T>(text: string, errors: IDiagnostic[] | undefined, options: IParseOptions): IParserASTResult<T, IJsonASTNode, number[]>;
