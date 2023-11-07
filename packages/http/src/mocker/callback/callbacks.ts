import { IHttpCallbackOperation, IHttpOperationRequest, Dictionary } from '@stoplight/types';
import { resolveRuntimeExpressions } from '../../utils/runtimeExpression';
import { IHttpRequest, IHttpResponse } from '../../types';
import fetch, { RequestInit } from 'node-fetch';
import * as chalk from 'chalk';
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import * as A from 'fp-ts/Array';
import * as TE from 'fp-ts/TaskEither';
import * as RTE from 'fp-ts/ReaderTaskEither';
import * as J from 'fp-ts/Json';
import { head } from 'fp-ts/Array';
import { pipe } from 'fp-ts/function';
import { pick } from 'lodash';
import { generate as generateHttpParam } from '../generator/HttpParamGenerator';
import { validateOutput } from '../../validator';
import { parseResponse } from '../../utils/parseResponse';
import { logRequest, logResponse, violationLogger } from '../../utils/logger';
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

    logCallbackRequest({ logger, callbackName: callback.key, url, requestData });

    return pipe(
      TE.tryCatch(() => fetch(url, requestData), E.toError),
      TE.chain(parseResponse),
      TE.map(callbackResponseLogger({ logger, callbackName: callback.key })),
      TE.mapLeft(error => logger.error(`${chalk.blueBright(callback.key + ':')} Request failed: ${error.message}`)),
      TE.chainEitherK(element => {
        return pipe(
          validateOutput({ resource: callback, element }),
          E.mapLeft(violations => {
            pipe(violations, A.map(logViolation));
          })
        );
      })
    );
  };
}

function logCallbackRequest({
  logger,
  url,
  callbackName,
  requestData,
}: {
  logger: Logger;
  callbackName: string;
  url: string;
  requestData: Pick<RequestInit, 'headers' | 'method' | 'body'>;
}) {
  const prefix = `${chalk.blueBright(callbackName + ':')} ${chalk.grey('> ')}`;
  logger.info(`${prefix}Executing "${requestData.method}" callback to ${url}...`);
  logRequest({ logger, prefix, ...pick(requestData, 'body', 'headers') });
}

function callbackResponseLogger({ logger, callbackName }: { logger: Logger; callbackName: string }) {
  const prefix = `${chalk.blueBright(callbackName + ':')} ${chalk.grey('< ')}`;

  return (response: IHttpResponse) => {
    logger.info(`${prefix}Received callback response`);
    logResponse({ logger, prefix, ...pick(response, 'body', 'headers', 'statusCode') });
    return response;
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
      headers: O.toUndefined(assembleHeaders(resource.request, bodyAndMediaType?.mediaType)),
      body: bodyAndMediaType?.body,
      method: resource.method,
    },
  };
}

function assembleBody(request?: IHttpOperationRequest): O.Option<{ body: string; mediaType: string }> {
  return pipe(
    O.fromNullable(request?.body?.contents),
    O.bind('content', contents => head(contents)),
    O.bind('body', ({ content }) => generateHttpParam(content)),
    O.chain(({ body, content: { mediaType } }) =>
      pipe(
        J.stringify(body),
        E.map(body => ({ body, mediaType })),
        O.fromEither
      )
    )
  );
}

const assembleHeaders = (request?: IHttpOperationRequest, bodyMediaType?: string): O.Option<Dictionary<string>> =>
  pipe(
    O.fromNullable(request?.headers),
    O.chain(
      O.traverseArray(param =>
        pipe(
          generateHttpParam(param),
          O.map(value => [param.name, value])
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
