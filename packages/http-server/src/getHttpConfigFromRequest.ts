import { IHttpOperationConfig, IHttpRequest, ProblemJsonError, UNPROCESSABLE_ENTITY } from '@stoplight/prism-http';
import { pipe } from 'fp-ts/lib/pipeable';
import * as E from 'fp-ts/lib/Either';
import * as t from 'io-ts';
import { failure } from 'io-ts/lib/PathReporter';
import { BooleanFromString } from 'io-ts-types/lib/BooleanFromString';
//@ts-ignore
import * as parsePreferHeader from 'parse-prefer-header';

const headerPreferencesDecoder = t.union([
  t.undefined,
  t.partial(
    {
      code: t.string,
      dynamic: t.string.pipe(BooleanFromString),
      example: t.string,
    },
    'headerPreferences'
  ),
]);

const queryPreferencesDecoder = t.union([
  t.undefined,
  t.partial(
    {
      __code: t.string,
      __dynamic: t.string.pipe(BooleanFromString),
      __example: t.string,
    },
    'queryPreferences'
  ),
]);

type requestPreference = Partial<Omit<IHttpOperationConfig, 'mediaType'>>;

export const getHttpConfigFromRequest = (req: IHttpRequest): E.Either<Error, requestPreference> => {
  const preferenceSource =
    req.headers && req.headers['prefer']
      ? pipe(
          headerPreferencesDecoder.decode(parsePreferHeader(req.headers['prefer'])),
          E.map(parsed => ({ code: parsed?.code, dynamic: parsed?.dynamic, exampleKey: parsed?.example }))
        )
      : pipe(
          queryPreferencesDecoder.decode(req.url.query),
          E.map(parsed => ({ code: parsed?.__code, dynamic: parsed?.__dynamic, exampleKey: parsed?.__example }))
        );

  return pipe(
    preferenceSource,
    E.mapLeft(err => ProblemJsonError.fromTemplate(UNPROCESSABLE_ENTITY, failure(err).join('; ')))
  );
};
