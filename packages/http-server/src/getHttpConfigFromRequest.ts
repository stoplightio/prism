import { IHttpOperationConfig, IHttpRequest, ProblemJsonError, UNPROCESSABLE_ENTITY } from '@stoplight/prism-http';
import { pipe } from 'fp-ts/pipeable';
import * as E from 'fp-ts/Either';
import * as D from 'io-ts/lib/Decoder';
//@ts-ignore
import * as parsePreferHeader from 'parse-prefer-header';

const BooleanFromString = D.parse<string, boolean>(s =>
  s === 'true' ? D.success(true) : s === 'false' ? D.success(false) : D.failure(s, 'Not a boolean')
);

const PreferencesDecoder = D.partial({
  code: D.string,
  dynamic: pipe(D.string, BooleanFromString),
  example: D.string,
});

type RequestPreferences = Partial<Omit<IHttpOperationConfig, 'mediaType'>>;

export const getHttpConfigFromRequest = (req: IHttpRequest): E.Either<Error, RequestPreferences> => {
  const preferences: unknown =
    req.headers && req.headers['prefer']
      ? parsePreferHeader(req.headers['prefer'])
      : { code: req.url.query?.__code, dynamic: req.url.query?.__dynamic, example: req.url.query?.__example };

  return pipe(
    PreferencesDecoder.decode(preferences),
    E.bimap(
      err => ProblemJsonError.fromTemplate(UNPROCESSABLE_ENTITY, D.draw(err)),
      parsed => ({ code: parsed?.code, exampleKey: parsed?.example, dynamic: parsed?.dynamic })
    )
  );
};
