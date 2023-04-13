import { IPrismComponents, IPrismInput } from '@stoplight/prism-core';
import { IHttpOperation } from '@stoplight/types';
import fetch, { Response } from 'node-fetch';
import { constUndefined, pipe } from 'fp-ts/function';
import * as NEA from 'fp-ts/NonEmptyArray';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import * as RTE from 'fp-ts/ReaderTaskEither';
import * as J from 'fp-ts/Json';
import { defaults, omit, pick } from 'lodash';
import { format } from 'url';
import { posix } from 'path';
import { Logger } from 'pino';
import { IHttpConfig, IHttpRequest, IHttpResponse } from '../types';
import { parseResponse } from '../utils/parseResponse';
import { hopByHopHeaders } from './resources';
import { createUnauthorisedResponse, createUnprocessableEntityResponse } from '../mocker';
import { ProblemJsonError } from '../types';
import { PROXY_UNSUPPORTED_REQUEST_BODY, UPSTREAM_NOT_IMPLEMENTED } from './errors';
import * as createHttpProxyAgent from 'http-proxy-agent';
import * as createHttpsProxyAgent from 'https-proxy-agent';
import { toURLSearchParams } from '../utils/url';
import { logRequest, logResponse } from '../utils/logger';
import * as chalk from 'chalk';

const { version: prismVersion } = require('../../package.json'); // eslint-disable-line

const forward: IPrismComponents<IHttpOperation, IHttpRequest, IHttpResponse, IHttpConfig>['forward'] =
  (
    { data: input, validations }: IPrismInput<IHttpRequest>,
    baseUrl: string,
    upstreamProxy: IHttpConfig['upstreamProxy'],
    resource
  ): RTE.ReaderTaskEither<Logger, Error, IHttpResponse> =>
  logger =>
    pipe(
      NEA.fromArray(validations),
      TE.fromOption(constUndefined),
      TE.map(failedValidations => {
        const securityValidation = failedValidations.find(validation => validation.code === 401);

        return securityValidation
          ? createUnauthorisedResponse(securityValidation.tags)
          : createUnprocessableEntityResponse(failedValidations);
      }),
      TE.swap,
      TE.chainEitherK(() => serializeBodyForFetch(input, logger)),
      TE.chain(body =>
        TE.tryCatch(async () => {
          const partialUrl = new URL(baseUrl);
          const url = format(
            Object.assign(partialUrl, {
              pathname: posix.join(partialUrl.pathname || '', input.url.path),
              search: toURLSearchParams(input.url.query).toString(),
            })
          );

          logForwardRequest({ logger, url, request: input });
          let proxyAgent = undefined;
          if (upstreamProxy) {
            proxyAgent =
              partialUrl.protocol === 'https:'
                ? createHttpsProxyAgent(upstreamProxy)
                : createHttpProxyAgent(upstreamProxy);
          }

          return fetch(url, {
            agent: proxyAgent,
            body,
            method: input.method,
            headers: defaults(omit(input.headers, ['host']), {
              'accept-encoding': '*',
              accept: 'application/json, text/plain, */*',
              'user-agent': `Prism/${prismVersion}`,
            }),
          });
        }, E.toError)
      ),
      TE.chainFirst(response => {
        if (response.status === 501) {
          logger.warn(`Upstream call to ${input.url.path} has returned 501`);
          return TE.left(ProblemJsonError.fromTemplate(UPSTREAM_NOT_IMPLEMENTED));
        }

        logger.info(`The upstream call to ${input.url.path} has returned ${response.status}`);
        return TE.right(undefined);
      }),
      TE.map(forwardResponseLogger(logger)),
      TE.chain(parseResponse),
      TE.map(response => {
        if (resource && resource.deprecated && response.headers && !response.headers.deprecation) {
          response.headers.deprecation = 'true';
        }
        return response;
      }),
      TE.map(stripHopByHopHeaders)
    );

export default forward;

function serializeBodyForFetch(input: IHttpRequest, logger: Logger): E.Either<Error, string | undefined> {
  const upperMethod = input.method.toUpperCase();
  if (['GET', 'HEAD'].includes(upperMethod) && ![null, undefined].includes(input.body as any)) {
    logger.warn(`Upstream ${upperMethod} call to ${input.url.path} has request body`);
    return E.left(ProblemJsonError.fromTemplate(PROXY_UNSUPPORTED_REQUEST_BODY));
  }

  return serializeBody(input.body);
}

export function serializeBody(body: unknown): E.Either<Error, string | undefined> {
  if (typeof body === 'string') {
    return E.right(body);
  }

  if (body) return pipe(J.stringify(body), E.mapLeft(E.toError));

  return E.right(undefined);
}

function logForwardRequest({ logger, url, request }: { logger: Logger; url: string; request: IHttpRequest }) {
  const prefix = `${chalk.grey('> ')}`;
  logger.info(`${prefix}Forwarding "${request.method}" request to ${url}...`);
  logRequest({ logger, prefix, ...pick(request, 'body', 'headers') });
}

function forwardResponseLogger(logger: Logger) {
  return (response: Response) => {
    const prefix = chalk.grey('< ');

    logger.info(`${prefix}Received forward response`);

    const { status: statusCode } = response;

    logResponse({
      logger,
      statusCode,
      ...pick(response, 'body', 'headers'),
      prefix,
    });

    return response;
  };
}

const stripHopByHopHeaders = (response: IHttpResponse): IHttpResponse => {
  response.headers = omit(response.headers, hopByHopHeaders);
  return response;
};
