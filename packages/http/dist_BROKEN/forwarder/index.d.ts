import { IPrismComponents } from '@stoplight/prism-core';
import { IHttpOperation } from '@stoplight/types';
import { IHttpConfig, IHttpRequest, IHttpResponse } from '../types';
declare const forward: IPrismComponents<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig>['forward'];
export default forward;
