import { IHttpOperationConfig, IHttpRequest, ProblemJsonError, UNPROCESSABLE_ENTITY } from '@stoplight/prism-http';
import { pipe } from 'fp-ts/function';
import * as E from 'fp-ts/Either';
import * as D from 'io-ts/lib/Decoder';
//@ts-ignore
import * as parsePreferHeader from 'parse-prefer-header';

const BooleanFromString = D.parse<string, boolean>(s =>
  s === 'true' ? D.success(true) : s === 'false' ? D.success(false) : D.failure(s, 'a boolean')
);

const IntegerFromString = D.parse<string, number>(s => {
  return /^\d{3}$/.test(s) ? D.success(parseInt(s, 10)) : D.failure(s, 'a number');
});

const PreferencesDecoder = D.partial({
  code: pipe(D.string, IntegerFromString),
  dynamic: pipe(D.string, BooleanFromString),
  seed: D.string,
  example: D.string,
});

type RequestPreferences = Partial<Omit<IHttpOperationConfig, 'mediaType'>>;

export const getHttpConfigFromRequest = (
  req: Pick<IHttpRequest, 'headers' | 'url'>
): E.Either<ProblemJsonError, RequestPreferences> => {
  const preferences: unknown =
    req.headers && req.headers['prefer']
      ? parsePreferHeader(req.headers['prefer'])
      : {
          code: req.url.query?.__code,
          dynamic: req.url.query?.__dynamic,
          seed: req.url.query?.__seed,
          example: req.url.query?.__example,
        };

  return pipe(
    PreferencesDecoder.decode(preferences),
    E.bimap(
      err => ProblemJsonError.fromTemplate(UNPROCESSABLE_ENTITY, D.draw(err)),
      parsed => ({ code: parsed?.code, exampleKey: parsed?.example, dynamic: parsed?.dynamic, seed: parsed?.seed })
    )
  );
};
