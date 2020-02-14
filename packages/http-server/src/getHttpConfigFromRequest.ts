import { IHttpOperationConfig, IHttpRequest, ProblemJsonError, UNPROCESSABLE_ENTITY } from '@stoplight/prism-http';
import { pipe } from 'fp-ts/lib/pipeable';
import * as E from 'fp-ts/lib/Either';
import * as t from 'io-ts';
import { failure } from 'io-ts/lib/PathReporter';
import { BooleanFromString } from 'io-ts-types/lib/BooleanFromString';
//@ts-ignore
import * as parsePreferHeader from 'parse-prefer-header';

const PreferencesDecoder = t.union([
  t.undefined,
  t.partial(
    {
      code: t.string,
      dynamic: t.string.pipe(BooleanFromString),
      example: t.string,
    },
    'Preferences'
  ),
]);

type RequestPreferences = Partial<Omit<IHttpOperationConfig, 'mediaType'>>;

export const getHttpConfigFromRequest = (req: IHttpRequest): E.Either<Error, RequestPreferences> => {
  const preferences =
    req.headers && req.headers['prefer']
      ? parsePreferHeader(req.headers['prefer'])
      : { code: req.url.query?.__code, dynamic: req.url.query?.__dynamic, example: req.url.query?.__example };

  return pipe(
    PreferencesDecoder.decode(preferences),
    E.bimap(
      err => ProblemJsonError.fromTemplate(UNPROCESSABLE_ENTITY, failure(err).join('; ')),
      parsed => ({ code: parsed?.code, exampleKey: parsed?.example, dynamic: parsed?.dynamic })
    )
  );
};
