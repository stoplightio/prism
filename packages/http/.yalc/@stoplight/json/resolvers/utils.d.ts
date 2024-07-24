import { JsonPath } from '@stoplight/types';
export declare function applyOverrides(document: unknown, value: unknown): unknown;
export declare function resolveSource(origin: string, ref: string): string;
export declare function traverse(ctx: {
    value: unknown;
}, path: JsonPath, pointer: string): IterableIterator<[index: number, value: Record<string, unknown> & {
    $ref: string;
}]>;
