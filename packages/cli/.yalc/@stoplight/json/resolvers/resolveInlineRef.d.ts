import { Dictionary } from '@stoplight/types';
import { ResolvedRef } from './types';
export declare function resolveInlineRef(document: Record<string, unknown>, pointer: string): unknown;
export declare function resolveInlineRefWithLocation(document: Dictionary<unknown>, pointer: string): ResolvedRef;
