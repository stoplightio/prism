import { JsonPath } from '@stoplight/types';
export declare function combinePathAndUri(path: string, uri?: string): string;
export declare function relativeJsonPath(parentUri: string, uri: string): JsonPath;
export declare function getParentUri(uri: string): string | undefined;
export declare function encodeJsonPath(path: JsonPath): string;
