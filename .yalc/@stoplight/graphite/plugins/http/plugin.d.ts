import { HttpOperationTransformer, HttpServiceTransformer, ITransformOperationOpts, ITransformServiceOpts, OasVersion } from '@stoplight/http-spec/oas/types';
import { INodeSelector } from '../../graph/nodes';
import { IGraphitePlugin } from '../../types';
export declare const enum NodeTypes {
    HttpOperation = "http_operation",
    HttpService = "http_service"
}
interface IHttpPluginConfig<T> {
    version: OasVersion;
    serviceSelector: INodeSelector['selector'];
    operationSelector: INodeSelector['selector'];
    transformService: HttpServiceTransformer<ITransformServiceOpts<T>>;
    transformOperation: HttpOperationTransformer<ITransformOperationOpts<T>>;
}
export declare function createOasHttpPlugin<T>(config: IHttpPluginConfig<T>): IGraphitePlugin;
export {};
