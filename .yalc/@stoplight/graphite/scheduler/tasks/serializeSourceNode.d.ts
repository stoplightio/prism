import { ITextOperation, JsonPatch } from '../../graph/dom';
import { TaskRunFunc } from '../../scheduler';
import { SerializeFunc } from '../../types';
export declare function createSerializeSourceNodeHandler(serialize: SerializeFunc): TaskRunFunc;
export declare function diffText(oldText: string, newText: string): JsonPatch<ITextOperation>;
