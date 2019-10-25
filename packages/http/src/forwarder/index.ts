import { IPrismComponents } from '@stoplight/prism-core';
import { IHttpOperation } from '@stoplight/types';
import { mapValues } from 'lodash';
import fetch from 'node-fetch';
import * as typeIs from 'type-is';
import { toError } from 'fp-ts/lib/Either';
import * as TaskEither from 'fp-ts/lib/TaskEither';
import { defaults, omit } from 'lodash';
import { format, parse } from 'url';
import { IHttpConfig, IHttpRequest, IHttpResponse } from '../types';
import { posix } from 'path';

const { version: prismVersion } = require('../../package.json');

const forward: IPrismComponents<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig>['forward'] = (
  input: IHttpRequest,
  baseUrl: string
): TaskEither.TaskEither<Error, IHttpResponse> =>
  TaskEither.tryCatch<Error, IHttpResponse>(async () => {
    const partialUrl = parse(baseUrl);

    const response = await fetch(
      format({
        ...partialUrl,
        pathname: posix.join(partialUrl.pathname || '', input.url.path),
        query: input.url.query,
      }),
      {
        headers: defaults(omit(input.headers, ['host', 'accept']), {
          accept: 'application/json, text/plain, */*',
          'user-agent': `Prism/${prismVersion}`,
        }),
      }
    );

    const parsedBody = typeIs.is(response.headers.get('content-type') || '', ['application/json', 'application/*+json'])
      ? await response.json()
      : await response.text();

    return {
      statusCode: response.status,
      headers: mapValues(response.headers.raw(), hValue => hValue.join(' ')),
      body: parsedBody,
    };
  }, toError);

export default forward;
