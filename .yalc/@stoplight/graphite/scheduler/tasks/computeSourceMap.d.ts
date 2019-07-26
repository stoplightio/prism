import { SourceMapNode } from '../../graph/nodes';
import { TaskRunFunc } from '../../scheduler';
import { ISourceNodeMap } from '../../types';
import { ITaskHandlerApi } from '../types';
export declare type CreateEdgesFunc = (nodes: SourceMapNode[], taskHandlerApi: ITaskHandlerApi) => void;
export declare function createComputeSourceMapHandler(map: ISourceNodeMap[], createEdges?: CreateEdgesFunc): TaskRunFunc;
