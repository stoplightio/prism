import { factory, PickRequired } from '@stoplight/prism-core';
import { IHttpOperation } from '@stoplight/types';
import { defaults } from 'lodash';
import { forwarder } from './forwarder';
import { mocker } from './mocker';
import { router } from './router';
import { validator } from './validator';
export * from './types';

import { IHttpConfig, IHttpRequest, IHttpResponse, TPrismHttpComponents } from './types';

const createInstance = (defaultConfig: IHttpConfig, components?: PickRequired<TPrismHttpComponents, 'logger'>) =>
  factory<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig>(
    defaultConfig,
    defaults(components, {
      router,
      forwarder,
      validator,
      mocker,
    }),
  );

export { createInstance };
