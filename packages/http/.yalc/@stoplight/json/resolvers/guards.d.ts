import { Segment } from '@stoplight/types';
export declare function assertResolvableInput(value: unknown, segment: Segment, pointer: string): asserts value is Record<string, unknown> | unknown[];
export declare function assertObjectWithValidRef(value: Record<string, unknown>): asserts value is Record<string, unknown> & {
    $ref: string;
};
export declare const hasSomeRef: (obj: unknown) => obj is Record<string, unknown> & {
    $ref: unknown;
};
