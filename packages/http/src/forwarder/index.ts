import { IPrismComponents } from '@stoplight/prism-core';
import { IHttpOperation } from '@stoplight/types';
import axios from 'axios';
import { toError } from 'fp-ts/lib/Either';
import * as TaskEither from 'fp-ts/lib/TaskEither';
import { defaults, omit } from 'lodash';
import { IHttpConfig, IHttpRequest, IHttpResponse } from '../types';
const { version: prismVersion } = require('../../package.json');

const forward: IPrismComponents<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig>['forward'] = (
  input: IHttpRequest,
  baseUrl: string,
): TaskEither.TaskEither<Error, IHttpResponse> =>
  TaskEither.tryCatch<Error, IHttpResponse>(async () => {
    const response = await axios.request<unknown>({
      method: input.method as any,
      baseURL: baseUrl,
      url: input.url.path,
      params: input.url.query,
      data: input.body,
      headers: defaults(omit(input.headers, 'host'), { 'user-agent': `Prism/${prismVersion}` }),
      validateStatus: () => true,
    });

    return {
      statusCode: response.status,
      headers: response.headers,
      body: response.data,
    };
  }, toError);

export default forward;
