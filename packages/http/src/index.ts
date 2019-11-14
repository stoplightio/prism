import { factory } from '@stoplight/prism-core';
import { IHttpOperation } from '@stoplight/types';
import { defaults } from 'lodash';
import forward from './forwarder';
import mock from './mocker';
import route from './router';
import { validateInput, validateOutput, validateSecurity } from './validator';
export * from './types';
export * from './getHttpOperations';
export * from './mocker/errors';
export * from './router/errors';
export * from './mocker/serializer/style';
export { generate as generateHttpParam } from './mocker/generator/HttpParamGenerator';
import { IHttpConfig, IHttpResponse, IHttpRequest, PickRequired, PrismHttpComponents, IHttpProxyConfig } from './types';

export const createInstance = (
  defaultConfig: IHttpConfig | IHttpProxyConfig,
  components: PickRequired<Partial<PrismHttpComponents>, 'logger'>
) =>
  factory<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig>(
    defaultConfig,
    defaults(components, { route, validateInput, validateOutput, validateSecurity, mock, forward })
  );
