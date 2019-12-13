import { IHttpCallbackOperation, IHttpOperationRequest, Dictionary } from '@stoplight/types';
import { resolveRuntimeExpressions } from '../../utils/runtimeExpression';
import { IHttpRequest, IHttpResponse } from '../../types';
import fetch from 'node-fetch';
import * as O from 'fp-ts/lib/Option';
import * as E from 'fp-ts/lib/Either';
import { map, reduce } from 'fp-ts/lib/Array';
import * as TE from 'fp-ts/lib/TaskEither';
import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import { head } from 'fp-ts/lib/Array';
import { pipe } from 'fp-ts/lib/pipeable';
import { generate as generateHttpParam } from '../generator/HttpParamGenerator';
import { validateOutput } from '../../validator';
import { parseResponse } from '../../utils/parseResponse';
import { violationLogger } from '../../utils/logger';
import { Logger } from 'pino';

export function runCallback({
  callback,
  request,
  response,
}: {
  callback: IHttpCallbackOperation;
  request: IHttpRequest;
  response: IHttpResponse;
}): RTE.ReaderTaskEither<Logger, void, unknown> {
  return logger => {
    const { url, requestData } = assembleRequest({ resource: callback, request, response });
    const logViolation = violationLogger(logger);

    logger.info({ name: 'CALLBACK' }, `${callback.callbackName}: Making request to ${url}...`);

    return pipe(
      TE.tryCatch(() => fetch(url, requestData), E.toError),
      TE.chain(parseResponse),
      TE.mapLeft(error =>
        logger.error({ name: 'CALLBACK' }, `${callback.callbackName}: Request failed: ${error.message}`)
      ),
      TE.chain(element => {
        logger.info({ name: 'CALLBACK' }, `${callback.callbackName}: Request finished`);

        return pipe(
          validateOutput({ resource: callback, element }),
          E.mapLeft(violations => {
            pipe(violations, map(logViolation));
          }),
          TE.fromEither
        );
      })
    );
  };
}

function assembleRequest({
  resource,
  request,
  response,
}: {
  resource: IHttpCallbackOperation;
  request: IHttpRequest;
  response: IHttpResponse;
}) {
  const bodyAndMediaType = O.toUndefined(assembleBody(resource.request));
  return {
    url: resolveRuntimeExpressions(resource.path, request, response),
    requestData: {
      headers: O.toUndefined(assembleHeaders(resource.request, bodyAndMediaType && bodyAndMediaType.mediaType)),
      body: bodyAndMediaType && bodyAndMediaType.body,
      method: resource.method,
    },
  };
}

function assembleBody(request?: IHttpOperationRequest): O.Option<{ body: string; mediaType: string }> {
  return pipe(
    O.fromNullable(request),
    O.mapNullable(request => request.body),
    O.mapNullable(body => body.contents),
    O.chain(head),
    O.chain(param =>
      pipe(
        param,
        generateHttpParam,
        O.map(body => ({ body, mediaType: param.mediaType }))
      )
    ),
    O.chain(({ body, mediaType }) =>
      pipe(
        E.stringifyJSON(body, () => undefined),
        E.map(body => ({ body, mediaType })),
        O.fromEither
      )
    )
  );
}

function assembleHeaders(request?: IHttpOperationRequest, bodyMediaType?: string): O.Option<Dictionary<string>> {
  return pipe(
    O.fromNullable(request),
    O.mapNullable(request => request.headers),
    O.map(params =>
      pipe(
        params,
        reduce({}, (headers, param) =>
          pipe(
            param,
            generateHttpParam,
            O.fold(
              () => headers,
              value => ({ ...headers, [param.name]: value })
            )
          )
        )
      )
    ),
    O.reduce(
      pipe(
        O.fromNullable(bodyMediaType),
        O.map(mediaType => ({ 'content-type': mediaType }))
      ),
      (mediaTypeHeader, headers) => ({ ...headers, ...mediaTypeHeader })
    )
  );
}
