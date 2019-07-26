import { IDisposable } from '@stoplight/lifecycle';
import { GraphiteError } from '.';
import { INotifier } from './notifier';
export interface IErrorReporter {
    reportError(error: GraphiteError): void;
    onError(handler: (result: {
        error: GraphiteError;
    }) => void): IDisposable;
}
declare class ErrorReporter implements IErrorReporter {
    private notifier;
    constructor(notifier: INotifier);
    reportError(error: GraphiteError): void;
    onError(handler: (result: {
        error: GraphiteError;
    }) => void): INotifier;
}
export declare const errorReporter: ErrorReporter;
export {};
