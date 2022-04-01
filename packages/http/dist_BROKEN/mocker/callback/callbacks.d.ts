import { IHttpCallbackOperation } from '@stoplight/types';
import { IHttpRequest, IHttpResponse } from '../../types';
import * as RTE from 'fp-ts/ReaderTaskEither';
import { Logger } from 'pino';
export declare function runCallback({ callback, request, response, }: {
    callback: IHttpCallbackOperation;
    request: IHttpRequest;
    response: IHttpResponse;
}): RTE.ReaderTaskEither<Logger, void, unknown>;
