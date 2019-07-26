import { JsonPatch } from '../../graph/dom';
import { ISourceNodeInstance } from '../../graph/nodes';
import { TaskRunFunc } from '../../scheduler';
import { DeserializeFunc } from '../../types';
export declare function createDeserializeSourceNodeHandler(deserialize: DeserializeFunc): TaskRunFunc;
export declare function identifyMoveOperations(patch: JsonPatch, node: ISourceNodeInstance): JsonPatch;
