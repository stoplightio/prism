import * as Either from 'fp-ts/lib/Either';

export function serializeBody(body: unknown): Either.Either<Error, string | undefined> {
  if (typeof body === 'string') {
    return Either.right(body);
  }

  if (body) return Either.stringifyJSON(body, Either.toError);

  return Either.right(undefined);
}
