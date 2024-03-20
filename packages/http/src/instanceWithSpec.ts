import { createInstance } from './index';
import { getHttpOperationsFromSpec } from './utils/operations';
import { IHttpConfig, IHttpRequest, ProblemJsonError } from './types';
import * as pino from 'pino';
import { pipe } from 'fp-ts/function';
import { isRight, isLeft } from 'fp-ts/lib/Either';
import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';
import * as IOE from 'fp-ts/IOEither';
import { Dictionary } from '@stoplight/types';

export async function createAndCallPrismInstanceWithSpec(
  document: string | object,
  options: IHttpConfig,
  prismRequest: IHttpRequest,
  logger: pino.Logger
) {
  const operations = await getHttpOperationsFromSpec(document);
  const prism = createInstance(options, { logger: logger.child({ name: 'PRISM INSTANCE' }) });
  const result = await pipe(
    prism.request(prismRequest, operations),
    TE.chainIOEitherK(response => {
      return IOE.fromEither(
        E.tryCatch(() => {
          return response;
        }, E.toError)
      );
    }),
    TE.mapLeft((e: Error & { status?: number; additional?: { headers?: Dictionary<string> } }) => {
      logger.error({ prismRequest }, `Unable to generate response: ${e}`);
      return e.status || 500, JSON.stringify(ProblemJsonError.toProblemJson(e));
    })
  )();
  if (isRight(result)) {
    return result.right;
  }
  if (isLeft(result)) {
    return result.left;
  }
  return result;
}
