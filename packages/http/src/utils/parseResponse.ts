import type { Response } from 'node-fetch';
import { is as typeIs } from 'type-is';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import { mapValues } from 'lodash';
import { pipe } from 'fp-ts/function';
import { Dictionary } from '@stoplight/types';
import { IHttpResponse } from '../types';

export const parseResponseBody = (
  response: Pick<Response, 'headers' | 'json' | 'text' | 'status'>
): TE.TaskEither<Error, unknown> =>
  TE.tryCatch(
    () =>
      (response.status != 204 && typeIs(response.headers.get('content-type') || '', ['application/json', 'application/*+json']))
        ? response.json()
        : response.text(),
    E.toError
  );

export const parseResponseHeaders = (headers: Dictionary<string[]>): Dictionary<string> =>
  mapValues(headers, hValue => hValue.join(','));

export const parseResponse = (
  response: Pick<Response, 'headers' | 'json' | 'text' | 'status'>
): TE.TaskEither<Error, IHttpResponse> =>
  pipe(
    parseResponseBody(response),
    TE.map(body => ({
      statusCode: response.status,
      headers: parseResponseHeaders(response.headers.raw()),
      body,
    }))
  );
