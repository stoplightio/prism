import { IHttpCallbackOperation, IHttpOperationRequest } from '@stoplight/types';
import { resolveRuntimeExpressions } from '../../utils/runtimeExpression';
import { IHttpRequest, IHttpResponse } from '../../types';
import fetch from 'node-fetch';
import * as Option from 'fp-ts/lib/Option';
import * as Either from 'fp-ts/lib/Either';
import { map, reduce } from 'fp-ts/lib/Array';
import * as TaskEither from 'fp-ts/lib/TaskEither';
import * as ReaderTaskEither from 'fp-ts/lib/ReaderTaskEither';
import { head } from 'fp-ts/lib/Array';
import { pipe } from 'fp-ts/lib/pipeable';
import { generate as generateHttpParam } from '../generator/HttpParamGenerator';
import { validateOutput } from '../../validator';
import { parseResponse } from '../../utils/parseResponse';
import withLogger from '../../withLogger';
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
}): ReaderTaskEither.ReaderTaskEither<Logger, void, unknown> {
  return withLogger(logger => {
    const { url, requestData } = assembleRequest({ resource: callback, request, response });
    const logViolation = violationLogger(logger);

    logger.info({ name: 'CALLBACK' }, `${callback.callbackName}: Making request to ${url}...`);

    return pipe(
      TaskEither.tryCatch(() => fetch(url, requestData), Either.toError),
      TaskEither.chain(parseResponse),
      TaskEither.mapLeft(error =>
        logger.error({ name: 'CALLBACK' }, `${callback.callbackName}: Request failed: ${error.message}`)
      ),
      TaskEither.chain(element => {
        logger.info({ name: 'CALLBACK' }, `${callback.callbackName}: Request finished`);

        return pipe(
          validateOutput({ resource: callback, element }),
          Either.mapLeft(violations => {
            pipe(
              violations,
              map(logViolation)
            );
          }),
          TaskEither.fromEither
        );
      })
    );
  });
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
  const bodyAndMediaType = Option.toUndefined(assembleBody(resource.request));
  return {
    url: resolveRuntimeExpressions(resource.path, request, response),
    requestData: {
      headers: Option.toUndefined(assembleHeaders(resource.request, bodyAndMediaType && bodyAndMediaType.mediaType)),
      body: bodyAndMediaType && bodyAndMediaType.body,
      method: resource.method,
    },
  };
}

function assembleBody(request?: IHttpOperationRequest): Option.Option<{ body: string; mediaType: string }> {
  return pipe(
    Option.fromNullable(request),
    Option.mapNullable(request => request.body),
    Option.mapNullable(body => body.contents),
    Option.chain(head),
    Option.chain(param =>
      pipe(
        param,
        generateHttpParam,
        Option.map(body => ({ body, mediaType: param.mediaType }))
      )
    ),
    Option.chain(({ body, mediaType }) =>
      pipe(
        Either.stringifyJSON(body, () => undefined),
        Either.map(body => ({ body, mediaType })),
        Option.fromEither
      )
    )
  );
}

function assembleHeaders(
  request?: IHttpOperationRequest,
  bodyMediaType?: string
): Option.Option<{ [key: string]: string }> {
  return pipe(
    Option.fromNullable(request),
    Option.mapNullable(request => request.headers),
    Option.map(params =>
      pipe(
        params,
        reduce({}, (headers, param) =>
          pipe(
            param,
            generateHttpParam,
            Option.fold(() => headers, value => ({ ...headers, [param.name]: value }))
          )
        )
      )
    ),
    Option.reduce(
      pipe(
        Option.fromNullable(bodyMediaType),
        Option.map(mediaType => ({ 'content-type': mediaType }))
      ),
      (mediaTypeHeader, headers) => ({ ...headers, ...mediaTypeHeader })
    )
  );
}
