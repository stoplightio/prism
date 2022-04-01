import { IPrism, IPrismComponents, IPrismProxyConfig, IPrismMockConfig } from '@stoplight/prism-core';
import { Overwrite } from 'utility-types';
import { Dictionary, HttpMethod, IHttpOperation, INodeExample, INodeExternalExample } from '@stoplight/types';
import type { JSONSchema7 } from 'json-schema';
import { Either } from 'fp-ts/Either';
export declare type PrismHttpInstance = IPrism<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig>;
export declare type PrismHttpComponents = IPrismComponents<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig>;
export interface IHttpOperationConfig {
    mediaTypes?: string[];
    code?: number;
    exampleKey?: string;
    dynamic: boolean;
}
export declare type IHttpMockConfig = Overwrite<IPrismMockConfig, {
    mock: IHttpOperationConfig;
}>;
export declare type IHttpProxyConfig = IPrismProxyConfig;
export declare type IHttpConfig = IHttpProxyConfig | IHttpMockConfig;
export declare type IHttpNameValues = Dictionary<string | string[]>;
export declare type IHttpNameValue = Dictionary<string>;
export interface IHttpUrl {
    baseUrl?: string;
    path: string;
    query?: IHttpNameValues;
}
export interface IHttpRequest {
    method: HttpMethod;
    url: IHttpUrl;
    headers?: IHttpNameValue;
    body?: unknown;
}
export interface IHttpResponse {
    statusCode: number;
    headers?: IHttpNameValue;
    body?: unknown;
}
export declare type ProblemJson = {
    type: string;
    title: string;
    status: number;
    detail: string;
};
export declare class ProblemJsonError extends Error {
    readonly name: string;
    readonly message: string;
    readonly status: number;
    readonly detail: string;
    readonly additional?: Dictionary<unknown, string> | undefined;
    static fromTemplate(template: Omit<ProblemJson, 'detail'>, detail?: string, additional?: Dictionary<unknown>): ProblemJsonError;
    static toProblemJson(error: Error & {
        detail?: string;
        status?: number;
        additional?: Dictionary<unknown>;
    }): ProblemJson;
    constructor(name: string, message: string, status: number, detail: string, additional?: Dictionary<unknown, string> | undefined);
}
export declare type ContentExample = INodeExample | INodeExternalExample;
export declare type PayloadGenerator = (f: JSONSchema) => Either<Error, unknown>;
export declare type PickRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
export declare type JSONSchema = JSONSchema7;
