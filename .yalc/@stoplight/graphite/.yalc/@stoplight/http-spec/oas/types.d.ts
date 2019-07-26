import { IHttpOperation, IHttpService } from '@stoplight/types';
import { OpenAPIObject } from 'openapi3-ts';
import { Spec } from 'swagger-schema-official';
export declare const enum OasVersion {
    OAS2 = 2,
    OAS3 = 3
}
export interface ITransformServiceOpts<T> {
    document: T;
}
export declare type HttpServiceTransformer<T> = (opts: T) => IHttpService;
export declare type Oas2TransformServiceOpts = ITransformServiceOpts<Spec>;
export declare type Oas3TransformServiceOpts = ITransformServiceOpts<OpenAPIObject>;
export declare type Oas2HttpServiceTransformer = HttpServiceTransformer<Oas2TransformServiceOpts>;
export declare type Oas3HttpServiceTransformer = HttpServiceTransformer<Oas3TransformServiceOpts>;
export interface ITransformOperationOpts<T> {
    document: T;
    path: string;
    method: string;
}
export declare type HttpOperationTransformer<T> = (opts: T) => IHttpOperation;
export declare type Oas2TransformOperationOpts = ITransformOperationOpts<Spec>;
export declare type Oas3TransformOperationOpts = ITransformOperationOpts<OpenAPIObject>;
export declare type Oas2HttpOperationTransformer = HttpOperationTransformer<Oas2TransformOperationOpts>;
export declare type Oas3HttpOperationTransformer = HttpOperationTransformer<Oas3TransformOperationOpts>;
