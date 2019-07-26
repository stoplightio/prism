import { IGraphitePlugin, IParser } from '../../types';
export declare const createParser: () => IParser;
export declare const createPlugin: (parser?: IParser) => IGraphitePlugin;
