import type { JsonPath } from '@stoplight/types';
declare type Document = Record<string, unknown> | unknown[];
export declare function resolveExternalRef(inventory: Record<string, Document | Promise<Document>>, origin: string, ref: string): Promise<unknown>;
export declare function resolveExternalRefWithLocation(inventory: Record<string, Document | Promise<Document>>, origin: string, ref: string): Promise<{
    source: string;
    location: JsonPath;
    value: unknown;
}>;
export {};
