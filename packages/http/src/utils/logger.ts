import withLogger from '../withLogger';
import { Dictionary, DiagnosticSeverity } from '@stoplight/types';
import { IPrismDiagnostic } from '@stoplight/prism-core';
import { Logger } from 'pino';
import { RequestInit, Response } from 'node-fetch';
import { pipe } from 'fp-ts/lib/pipeable';
import * as Option from 'fp-ts/lib/Option';
import chalk from 'chalk';

import { IHttpRequest, IHttpResponse } from '../types';
import { serializeBody } from './serializeBody';

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

export function logRequest({
  logger,
  prefix = '',
  headers,
  body,
}: {
  logger: Logger;
  prefix?: string;
  body?: BodyInput;
  headers?: HeadersInput;
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
