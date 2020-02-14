import { IHttpOperationConfig, IHttpRequest, ProblemJsonError, UNPROCESSABLE_ENTITY } from '@stoplight/prism-http';
import { pipe } from 'fp-ts/lib/pipeable';
import * as E from 'fp-ts/lib/Either';
import * as t from 'io-ts';
import { failure } from 'io-ts/lib/PathReporter';
import { BooleanFromString } from 'io-ts-types/lib/BooleanFromString';
//@ts-ignore
import * as parsePreferHeader from 'parse-prefer-header';

const preferencesDecoder = t.union([
  t.undefined,
  t.partial(
    {
      __code: t.string,
      __dynamic: t.string.pipe(BooleanFromString),
      __example: t.string,
    },
    'Preferences'
  ),
]);

type requestPreference = Partial<Omit<IHttpOperationConfig, 'mediaType'>>;

export const getHttpConfigFromRequest = (req: IHttpRequest): E.Either<Error, requestPreference> => {
  const preferenceSource =
    req.headers && req.headers['prefer'] ? parsePreferHeader(req.headers['prefer']) : req.url.query;

  return pipe(
    preferencesDecoder.decode(preferenceSource),
    E.bimap(
      err => ProblemJsonError.fromTemplate(UNPROCESSABLE_ENTITY, failure(err).join('; ')),
      parsed => ({ code: parsed?.__code, dynamic: parsed?.__dynamic, exampleKey: parsed?.__example })
    )
  );
};
