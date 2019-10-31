import { Response } from 'node-fetch';
import { is as typeIs } from 'type-is';
import * as Either from 'fp-ts/lib/Either';
import * as TaskEither from 'fp-ts/lib/TaskEither';
import { mapValues } from 'lodash';
import { pipe } from 'fp-ts/lib/pipeable';
import { Dictionary } from '@stoplight/types';
import { IHttpResponse } from '../types';

export function parseResponseBody(response: Response): TaskEither.TaskEither<Error, any> {
  return TaskEither.tryCatch(
    () =>
      typeIs(response.headers.get('content-type') || '', ['application/json', 'application/*+json'])
        ? response.json()
        : response.text(),
    Either.toError
  );
}

export function parseResponseHeaders(response: Response): Dictionary<string, string> {
  return mapValues(response.headers.raw(), hValue => hValue.join(' '));
}

export function parseResponse(response: Response): TaskEither.TaskEither<Error, IHttpResponse> {
  return pipe(
    parseResponseBody(response),
    TaskEither.map(body => ({
      statusCode: response.status,
      headers: parseResponseHeaders(response),
      body,
    }))
  );
}
