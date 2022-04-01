import type { Response } from 'node-fetch';
import * as TE from 'fp-ts/TaskEither';
import { Dictionary } from '@stoplight/types';
import { IHttpResponse } from '../types';
export declare const parseResponseBody: (response: Pick<Response, 'headers' | 'json' | 'text'>) => TE.TaskEither<Error, unknown>;
export declare const parseResponseHeaders: (headers: Dictionary<string[]>) => Dictionary<string>;
export declare const parseResponse: (response: Pick<Response, 'headers' | 'json' | 'text' | 'status'>) => TE.TaskEither<Error, IHttpResponse>;
