import { factory } from '@stoplight/prism-core';
import { IHttpOperation } from '@stoplight/types';
import { defaults } from 'lodash';
import { mocker } from './mocker';
import { router } from './router';
import { validator } from './validator';
export * from './types';
export * from './getHttpOperations';

import { IHttpConfig, IHttpRequest, IHttpResponse, PickRequired, PrismHttpComponents } from './types';

const createInstance = (
  defaultConfig: IHttpConfig,
  components?: PickRequired<Partial<PrismHttpComponents>, 'logger'>,
) =>
  factory<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig>(
    defaultConfig,
    defaults(components, {
      router,
      validator,
      mocker,
    }),
  );

export { createInstance };
