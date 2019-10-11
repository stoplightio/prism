import { IPrismComponents } from '@stoplight/prism-core';
import { IHttpOperation } from '@stoplight/types';
import { fromPairs } from 'lodash';
import fetch from 'node-fetch';
import { toError } from 'fp-ts/lib/Either';
import * as TaskEither from 'fp-ts/lib/TaskEither';
import { defaults, omit } from 'lodash';
import { format } from 'url';
import { IHttpConfig, IHttpRequest, IHttpResponse } from '../types';

const { version: prismVersion } = require('../../package.json');

const forward: IPrismComponents<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig>['forward'] = (
  input: IHttpRequest,
  baseUrl: string
): TaskEither.TaskEither<Error, IHttpResponse> =>
  TaskEither.tryCatch<Error, IHttpResponse>(
    () =>
      fetch(format({ hostname: baseUrl, pathname: input.url.path, query: input.url.query }), {
        headers: defaults(omit(input.headers, 'host'), { 'user-agent': `Prism/${prismVersion}` }),
      })
        .then(r => Promise.all([r, r.json()]))
        .then<IHttpResponse>(([response, body]) => ({
          statusCode: response.status,
          headers: fromPairs(Object.entries(response.headers)),
          body,
        })),
    toError
  );

export default forward;
