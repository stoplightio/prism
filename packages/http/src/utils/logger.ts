import withLogger from '../withLogger';
import { Dictionary, DiagnosticSeverity } from '@stoplight/types';
import { IPrismDiagnostic } from '@stoplight/prism-core';
import { Logger } from 'pino';
import { RequestInit, Response } from 'node-fetch';
import { pipe } from 'fp-ts/lib/function';
import * as Option from 'fp-ts/lib/Option';
import * as chalk from 'chalk';

import { IHttpNameValues, IHttpRequest, IHttpResponse, IHttpUrl } from '../types';
import { serializeBody } from '../forwarder';

export const violationLogger = withLogger(logger => {
  return (violation: IPrismDiagnostic) => {
    const path = violation.path ? violation.path.join('.') + ' ' : '';
    const message = `Violation: ${path}${violation.message}`;
    if (violation.severity === DiagnosticSeverity.Error) {
      logger.error({ name: 'VALIDATOR' }, message);
    } else if (violation.severity === DiagnosticSeverity.Warning) {
      logger.warn({ name: 'VALIDATOR' }, message);
    } else {
      logger.info({ name: 'VALIDATOR' }, message);
    }
  };
});

type HeadersInput = RequestInit['headers'] | Response['headers'] | IHttpRequest['headers'] | IHttpResponse['headers'];
type BodyInput = RequestInit['body'] | Response['body'] | IHttpRequest['body'] | IHttpResponse['body'];
type UrlInput = IHttpUrl;

export function logHeaders({
  logger,
  prefix = '',
  headers,
}: {
  logger: Logger;
  prefix?: string;
  headers: HeadersInput;
}) {
  pipe(
    pipe(
      headers,
      Option.fromPredicate((headers): headers is [string, string][] => Array.isArray(headers))
    ),
    Option.alt(() => Option.some(Object.entries(headers as Dictionary<string>))),
    Option.map(headers => {
      logger.debug(`${prefix}${chalk.grey('Headers:')}`);
      headers.forEach(([name, value]) => logger.debug(`${prefix}\t${name}: ${value}`));
    })
  );
}

export function logBody({ logger, prefix = '', body }: { logger: Logger; prefix?: string; body: BodyInput }) {
  pipe(
    serializeBody(body),
    Option.fromEither,
    Option.fold(
      () => undefined,
      body => logger.debug(`${prefix}${chalk.grey('Body:')} ${body}`)
    )
  );
}

export function logQuery({ logger, prefix = '', query }: { logger: Logger; prefix?: string; query: IHttpNameValues }) {
  pipe(
    Option.fromNullable(query),
    Option.filter(q => Object.keys(q).length > 0),
    Option.map(query => {
      logger.debug(`${prefix}${chalk.grey('Query:')}`);
      Object.entries(query).forEach(([name, value]) => {
        const out = Array.isArray(value) ? JSON.stringify(value) : value;
        logger.debug(`${prefix}\t${name}: ${out}`);
      });
    })
  );
}

export function logRequest({
  logger,
  prefix = '',
  headers,
  body,
  url,  
}: {
  logger: Logger;
  prefix?: string;
  body?: BodyInput;
  headers?: HeadersInput;
  url?: UrlInput;
}) {
  pipe(
    Option.fromNullable(headers),
    Option.map(headers =>
      logHeaders({
        logger,
        prefix,
        headers,
      })
    )
  );

  pipe(
    Option.fromNullable(body),
    Option.map(body =>
      logBody({
        logger,
        prefix,
        body,
      })
    )
  );

  pipe(
    Option.fromNullable(url?.query), 
    Option.map(query => 
      logQuery({
        logger,
        prefix,
        query,
      })
    )
  );
}

export function logResponse({
  logger,
  prefix = '',
  statusCode,
  headers,
  body,
}: {
  logger: Logger;
  prefix?: string;
  statusCode: number;
  headers?: HeadersInput;
  body?: BodyInput;
}) {
  logger.debug(`${prefix}${chalk.grey('Status:')} ${statusCode}`);

  pipe(
    Option.fromNullable(headers),
    Option.map(headers => logHeaders({ logger, prefix, headers }))
  );

  pipe(
    Option.fromNullable(body),
    Option.map(body =>
      logBody({
        logger,
        prefix,
        body,
      })
    )
  );
}
