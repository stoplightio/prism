import { IHttpOperation } from '@stoplight/types';
export * from './types';
export * from './mocker/errors';
export * from './router/errors';
export * from './mocker/serializer/style';
export { generate as generateHttpParam } from './mocker/generator/HttpParamGenerator';
import { IHttpConfig, IHttpResponse, IHttpRequest, PickRequired, PrismHttpComponents, IHttpProxyConfig } from './types';
export declare const createInstance: (defaultConfig: IHttpConfig | IHttpProxyConfig, components: PickRequired<Partial<PrismHttpComponents>, 'logger'>) => import("@stoplight/prism-core").IPrism<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig>;
