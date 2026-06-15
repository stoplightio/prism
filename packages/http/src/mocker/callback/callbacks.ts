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
    const logViolation = violationLogger(logger);

    return pipe(
      TE.tryCatch(
        () => assembleRequest({ resource: callback, request, response }),
        (): void => undefined
      ),
      TE.chain(({ url, requestData }) => {
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

async function assembleRequest({
  resource,
  request,
  response,
}: {
  resource: IHttpCallbackOperation;
  request: IHttpRequest;
  response: IHttpResponse;
}) {
  const bodyAndMediaType = await assembleBody(resource.request);
  return {
    url: resolveRuntimeExpressions(resource.path, request, response),
    requestData: {
      headers: await assembleHeaders(
        resource.request,
        O.isSome(bodyAndMediaType) ? bodyAndMediaType.value.mediaType : undefined
      ),
      body: O.isSome(bodyAndMediaType) ? bodyAndMediaType.value.body : undefined,
      method: resource.method,
    },
  };
}

async function assembleBody(request?: IHttpOperationRequest): Promise<O.Option<{ body: string; mediaType: string }>> {
  const contents = request?.body?.contents;
  if (!contents) return O.none;

  const content = contents[0];
  if (!content) return O.none;

  const body = await generateHttpParam(content);
  if (O.isNone(body)) return O.none;

  const stringified = J.stringify(body.value);
  if (E.isLeft(stringified)) return O.none;

  return O.some({ body: stringified.right, mediaType: content.mediaType });
}

async function assembleHeaders(
  request?: IHttpOperationRequest,
  bodyMediaType?: string
): Promise<Dictionary<string> | undefined> {
  const headers = request?.headers;
  if (!headers) {
    return bodyMediaType ? { 'content-type': bodyMediaType } : undefined;
  }

  const result: Dictionary<string> = {};
  for (const param of headers) {
    const value = await generateHttpParam(param);
    if (O.isSome(value)) {
      result[param.name] = value.value as string;
    }
  }

  if (bodyMediaType) {
    result['content-type'] = bodyMediaType;
  }

  return Object.keys(result).length > 0 ? result : bodyMediaType ? { 'content-type': bodyMediaType } : undefined;
}
