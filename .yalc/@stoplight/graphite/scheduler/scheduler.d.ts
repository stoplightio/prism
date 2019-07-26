import { IGraph } from '../graph';
import { GraphTask, GraphTaskOp, IScheduler, ITaskHandler } from '../scheduler';
export declare function createScheduler(props: ISchedulerProps): Scheduler;
export interface ISchedulerProps {
    graph: IGraph;
}
declare class Scheduler implements IScheduler {
    private _graph;
    private _queue;
    private _resolver;
    private _queued;
    private _handlers;
    private _running;
    constructor(props: ISchedulerProps);
    queue: (task: GraphTask) => Promise<void>;
    queueAll: (tasks: GraphTask[]) => Promise<void>[];
    queueLength(): number;
    registerHandler: (op: GraphTaskOp, handler: ITaskHandler) => import("@stoplight/lifecycle").IDisposable;
    drain: () => Promise<void>;
    run(task: GraphTask): Promise<void>;
    private _run;
    private drainQueue;
    private _runQueueTask;
    private _handleRunResult;
}
export {};
