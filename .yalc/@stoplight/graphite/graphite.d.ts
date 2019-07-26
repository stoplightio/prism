import { IDisposable } from '@stoplight/lifecycle';
import { IdGenerator, IGraph } from './graph';
import { INotifier } from './notifier';
import { IScheduler } from './scheduler';
import { IGraphite, IGraphitePlugin } from './types';
export interface IGraphiteProps {
    id?: string;
    graph?: IGraph;
    notifier?: INotifier;
    scheduler?: IScheduler;
    idGenerator?: IdGenerator;
    isMirror?: boolean;
}
export declare function createGraphite(props?: IGraphiteProps): Graphite;
declare class Graphite implements IGraphite {
    readonly id: string;
    readonly graph: IGraph;
    readonly notifier: INotifier;
    readonly scheduler: IScheduler;
    private _disposables;
    constructor(props: IGraphiteProps);
    registerPlugins(...plugins: IGraphitePlugin[]): IDisposable;
    dispose: () => void;
    private scheduleTransformations;
    private scheduleDeserialize;
    private scheduleSerialize;
    private scheduleComputeSourceMap;
    private scheduleResolveSourceNode;
    private scheduleValidateSourceNode;
}
export {};
