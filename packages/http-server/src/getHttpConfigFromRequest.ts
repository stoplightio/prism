import { IHttpOperationConfig, IHttpRequest, ProblemJsonError, UNPROCESSABLE_ENTITY } from '@stoplight/prism-http';
import { pipe } from 'fp-ts/lib/pipeable';
import * as E from 'fp-ts/lib/Either';
import * as t from 'io-ts';
import { failure } from 'io-ts/lib/PathReporter';
import { BooleanFromString } from 'io-ts-types/lib/BooleanFromString';

const preferencesDecoder = t.partial(
  {
    __code: t.string,
    __dynamic: t.string.pipe(BooleanFromString),
    __example: t.string,
  },
  'Preferences'
);

export const getHttpConfigFromRequest = (
  req: IHttpRequest
): E.Either<Error, Partial<Omit<IHttpOperationConfig, 'mediaType'>>> =>
  pipe(
    preferencesDecoder.decode(req.url.query),
    E.bimap(
      err => ProblemJsonError.fromTemplate(UNPROCESSABLE_ENTITY, failure(err).join('; ')),
      parsed => ({ code: parsed.__code, dynamic: parsed.__dynamic, exampleKey: parsed.__example })
    )
  );
