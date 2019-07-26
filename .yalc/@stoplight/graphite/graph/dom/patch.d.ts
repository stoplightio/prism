import { INotifier } from '../../notifier';
import { SourceNodeService } from '../nodes/sourceService';
import { IGraphDom, IGraphPatch, IGraphPatchResult, ITextOperation, JsonPatch } from './types';
export declare function applyPatch(dom: IGraphDom, patch: IGraphPatch, notifier: INotifier, sourceNodeService: SourceNodeService): IGraphPatchResult;
export declare function applyJsonPatch<T>(value: T, patch: JsonPatch): T;
export declare function applyTextOperation(value: string, operation: Omit<ITextOperation, 'op'>): string;
