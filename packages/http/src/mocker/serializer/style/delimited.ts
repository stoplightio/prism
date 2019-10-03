import { HttpParamStyles } from '@stoplight/types';
import * as Either from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import { JSONSchema } from '../../../types';

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
  schema?: JSONSchema,
  explode?: boolean,
): Either.Either<Error, string> {
  return pipe(
    schema,
    Either.fromNullable(new Error('Space/pipe/comma.. delimited style is only applicable to array parameter')),
    Either.chain(
      s =>
        s.type === 'array'
          ? Either.right(schema)
          : Either.left(new Error('Space/pipe/comma.. delimited style is only applicable to array parameter')),
    ),
    Either.map(() => (explode ? serializeAndExplode(name, value) : serializeAndImplode(separator, name, value))),
  );
}

export const serializeWithCommaDelimitedStyle = serializeWithDelimitedStyle.bind(undefined, ',');
export const serializeWithSpaceDelimitedStyle = serializeWithDelimitedStyle.bind(undefined, '%20');
export const serializeWithPipeDelimitedStyle = serializeWithDelimitedStyle.bind(undefined, '|');
