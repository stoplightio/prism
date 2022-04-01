import { IHttpRequest, IHttpResponse } from '../types';
import * as O from 'fp-ts/Option';
export declare function resolveRuntimeExpressions(input: string, request: IHttpRequest, response: IHttpResponse): string;
export declare function resolveRuntimeExpression(expr: string, request: IHttpRequest, response: IHttpResponse): O.Option<string>;
