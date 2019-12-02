import { Response } from 'node-fetch';
import { is as typeIs } from 'type-is';
import * as Either from 'fp-ts/lib/Either';
import * as TaskEither from 'fp-ts/lib/TaskEither';
import { mapValues } from 'lodash';
import { pipe } from 'fp-ts/lib/pipeable';
import { Dictionary } from '@stoplight/types';
import { IHttpResponse } from '../types';

export const parseResponseBody = (
  response: Pick<Response, 'headers' | 'json' | 'text'>
): TaskEither.TaskEither<Error, unknown> =>
  TaskEither.tryCatch(
    () =>
      typeIs(response.headers.get('content-type') || '', ['application/json', 'application/*+json'])
        ? response.json()
        : response.text(),
    Either.toError
  );

export const parseResponseHeaders = (headers: Dictionary<string[]>): Dictionary<string> =>
  mapValues(headers, hValue => hValue.join(' '));

export const parseResponse = (
  response: Pick<Response, 'headers' | 'json' | 'text' | 'status'>
): TaskEither.TaskEither<Error, IHttpResponse> =>
  pipe(
    parseResponseBody(response),
    TaskEither.map(body => ({
      statusCode: response.status,
      headers: parseResponseHeaders(response.headers.raw()),
      body,
    }))
  );
