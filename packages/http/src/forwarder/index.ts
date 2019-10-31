import { IPrismComponents } from '@stoplight/prism-core';
import { IHttpOperation } from '@stoplight/types';
import fetch from 'node-fetch';
import { toError } from 'fp-ts/lib/Either';
import * as TaskEither from 'fp-ts/lib/TaskEither';
import { defaults, omit } from 'lodash';
import { format, parse } from 'url';
import { IHttpConfig, IHttpRequest, IHttpResponse } from '../types';
import { posix } from 'path';
import { parseResponse } from '../utils/parseResponse';
import { pipe } from 'fp-ts/lib/pipeable';

const { version: prismVersion } = require('../../package.json');

const forward: IPrismComponents<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig>['forward'] = (
  input: IHttpRequest,
  baseUrl: string
): TaskEither.TaskEither<Error, IHttpResponse> =>
  pipe(
    TaskEither.tryCatch(async () => {
      const partialUrl = parse(baseUrl);

      return fetch(
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
    }, toError),
    TaskEither.chain(parseResponse)
  );

export default forward;
