import { HttpParamStyles } from '@stoplight/types';
import * as Either from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import { partial } from 'lodash';

function serializeAndImplode(separator: string, name: string, value: Array<string | number | boolean>) {
  return (
    encodeURIComponent(name) +
    '=' +
    value
      .map(String)
      .map(encodeURIComponent)
      .join(separator)
  );
}

function serializeAndExplode(name: string, value: Array<string | number | boolean>) {
  return value
    .map(String)
    .map(v => `${encodeURIComponent(name)}=${encodeURIComponent(v)}`)
    .join('&');
}

export function serializeWithDelimitedStyle(
  separator: string,
  name: string,
  value: Array<string | number | boolean>,
  explode?: boolean,
): Either.Either<Error, string> {
  return pipe(
    Array.isArray(value)
      ? Either.right(value)
      : Either.left(new Error('Space/pipe/comma delimited style is only applicable to array parameter')),
    Either.map(v => (explode ? serializeAndExplode(name, v) : serializeAndImplode(separator, name, v))),
  );
}

export const serializeWithCommaDelimitedStyle = partial(serializeWithDelimitedStyle, ',');
export const serializeWithSpaceDelimitedStyle = partial(serializeWithDelimitedStyle, '%20');
export const serializeWithPipeDelimitedStyle = partial(serializeWithDelimitedStyle, '|');
