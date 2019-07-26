import { IGraphitePlugin, IParser } from '../../types';
export interface IYamlParserOpts {
    indent?: number;
}
export declare const createYamlParser: (opts?: IYamlParserOpts) => IParser;
export declare const createYamlPlugin: (yamlParser?: IParser) => IGraphitePlugin;
