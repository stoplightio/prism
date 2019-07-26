import { ISelectableNode, NodeInstance } from '../graph/nodes';
import { ITaskHandler, ITaskHandlerApi } from './types';
declare type ITaskHandlerWithNoId = Pick<ITaskHandler, Exclude<keyof ITaskHandler, 'id'>>;
export declare class TaskHandler implements ITaskHandler {
    private decoratee;
    id: string;
    constructor(decoratee: ITaskHandlerWithNoId, id: string);
    selector(node: ISelectableNode): boolean;
    run(node: NodeInstance, api: ITaskHandlerApi): Promise<import("./types").GraphTaskResult>;
}
export declare const createTaskHandler: (decoratee: Pick<ITaskHandler, "selector" | "run">, id: string) => TaskHandler;
export {};
