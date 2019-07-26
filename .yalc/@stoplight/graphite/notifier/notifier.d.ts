import { EventEmitter } from '@stoplight/lifecycle';
import { IGraphiteEvents } from '../notifier/types';
export declare function createNotifier(): EventEmitter<IGraphiteEvents>;
