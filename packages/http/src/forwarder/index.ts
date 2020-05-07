import { IPrismComponents, IPrismInput } from '@stoplight/prism-core';
import { IHttpOperation } from '@stoplight/types';
import fetch from 'node-fetch';
import { pipe } from 'fp-ts/lib/pipeable';
import * as NEA from 'fp-ts/lib/NonEmptyArray';
import * as E from 'fp-ts/lib/Either';
import * as TE from 'fp-ts/lib/TaskEither';
import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import { defaults, omit } from 'lodash';
import { format, parse } from 'url';
import { posix } from 'path';
import { Logger } from 'pino';
import { IHttpConfig, IHttpRequest, IHttpResponse } from '../types';
import { parseResponse } from '../utils/parseResponse';
import { hopByHopHeaders } from './resources';
import { createUnauthorisedResponse, createUnprocessableEntityResponse } from '../mocker';

const { version: prismVersion } = require('../../package.json');

const forward: IPrismComponents<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig>['forward'] = (
  { data: input, validations }: IPrismInput<IHttpRequest>,
  baseUrl: string
): RTE.ReaderTaskEither<Logger, Error, IHttpResponse> => logger =>
  pipe(
    NEA.fromArray(validations),
    TE.fromOption(() => undefined),
    TE.map(failedValidations => {
      const securityValidation = failedValidations.find(validation => validation.code === 401);

      return securityValidation
        ? createUnauthorisedResponse(securityValidation.tags)
        : createUnprocessableEntityResponse(failedValidations);
    }),
    TE.swap,
    TE.chain(() => TE.fromEither(serializeBody(input.body))),
    TE.chain(body =>
      TE.tryCatch(async () => {
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
          headers: defaults(omit(input.headers, ['host']), {
            accept: 'application/json, text/plain, */*',
            'user-agent': `Prism/${prismVersion}`,
          }),
        });
      }, E.toError)
    ),
    TE.chain(parseResponse),
    TE.map(stripHopByHopHeaders)
  );

export default forward;

function serializeBody(body: unknown): E.Either<Error, string | undefined> {
  if (typeof body === 'string') {
    return E.right(body);
  }

  if (body) return E.stringifyJSON(body, E.toError);

  return E.right(undefined);
}

const stripHopByHopHeaders = (response: IHttpResponse): IHttpResponse => {
  response.headers = omit(response.headers, hopByHopHeaders);
  return response;
};
