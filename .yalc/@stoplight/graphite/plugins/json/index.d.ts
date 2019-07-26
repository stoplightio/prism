import { IGraphitePlugin, IParser } from '../../types';
export interface IJsonParserOpts {
    indent?: number;
}
export declare const createJsonParser: (opts?: IJsonParserOpts) => IParser;
export declare const createJsonPlugin: (jsonParser?: IParser) => IGraphitePlugin;
