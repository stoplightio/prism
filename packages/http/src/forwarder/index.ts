import { IPrismComponents } from '@stoplight/prism-core';
import { IHttpOperation } from '@stoplight/types';
import fetch from 'node-fetch';
import { pipe } from 'fp-ts/lib/pipeable';
import * as Either from 'fp-ts/lib/Either';
import * as TaskEither from 'fp-ts/lib/TaskEither';
import * as ReaderTaskEither from 'fp-ts/lib/ReaderTaskEither';
import { defaults, omit } from 'lodash';
import { format, parse } from 'url';
import { posix } from 'path';
import { Logger } from 'pino';
import { IHttpConfig, IHttpRequest, IHttpResponse } from '../types';
import { parseResponse } from '../utils/parseResponse';
import withLogger from '../withLogger';

const { version: prismVersion } = require('../../package.json');

const forward: IPrismComponents<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig>['forward'] = (
  input: IHttpRequest,
  baseUrl: string
): ReaderTaskEither.ReaderTaskEither<Logger, Error, IHttpResponse> =>
  withLogger(logger =>
    pipe(
      TaskEither.fromEither(serializeBody(input.body)),
      TaskEither.chain(body =>
        TaskEither.tryCatch(async () => {
          const partialUrl = parse(baseUrl);
          const url = format({
            ...partialUrl,
            pathname: posix.join(partialUrl.pathname || '', input.url.path),
            query: input.url.query,
          });

          logger.info(`Forwarding "${input.method}" request to ${url}...`);

          return fetch(url, {
            body,
            method: input.method,
            headers: defaults(omit(input.headers, ['host', 'accept']), {
              accept: 'application/json, text/plain, */*',
              'user-agent': `Prism/${prismVersion}`,
            }),
          });
        }, Either.toError)
      ),
      TaskEither.chain(parseResponse)
    )
  );

export default forward;

function serializeBody(body: unknown) {
  if (typeof body === 'string') {
    return Either.right(body);
  }

  if (body) return Either.stringifyJSON(body, Either.toError);

  return Either.right(undefined);
}
