import { IPrismComponents } from '@stoplight/prism-core';
import { IHttpOperation, Dictionary } from '@stoplight/types';
import { mapValues } from 'lodash';
import fetch from 'node-fetch';
import * as typeIs from 'type-is';
import { toError } from 'fp-ts/lib/Either';
import * as TaskEither from 'fp-ts/lib/TaskEither';
import { defaults, omit } from 'lodash';
import { format, parse, resolve } from 'url';
import { IHttpConfig, IHttpRequest, IHttpResponse } from '../types';
import { posix } from 'path';

const { version: prismVersion } = require('../../package.json');

const forward: IPrismComponents<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig>['forward'] = (
  input: IHttpRequest,
  baseUrl: string
): TaskEither.TaskEither<Error, IHttpResponse> =>
  TaskEither.tryCatch<Error, IHttpResponse>(() => {
    const partialUrl = parse(baseUrl);
    return fetch(
      format({
        protocol: partialUrl.protocol,
        hostname: partialUrl.hostname,
        pathname: posix.join(partialUrl.pathname || '', input.url.path),
        query: input.url.query,
      }),
      {
        headers: defaults(omit(input.headers, ['host', 'accept']), {
          accept: 'application/json, text/plain, */*',
          'user-agent': `Prism/${prismVersion}`,
        }),
      }
    )
      .then(r =>
        Promise.all([
          r,
          typeIs.is(r.headers.get('content-type') || '', ['application/json', 'application/*+json'])
            ? r.json()
            : r.text(),
        ])
      )
      .then<IHttpResponse>(([response, body]) => ({
        statusCode: response.status,
        headers: mapValues(response.headers.raw(), hValue => hValue.join(' ')),
        body,
      }));
  }, toError);

export default forward;
