import { IHttpRequest, IHttpResponse } from '../types';
import * as Option from 'fp-ts/lib/Option';
import { lookup } from 'fp-ts/lib/Array';
import { pipe } from 'fp-ts/lib/pipeable';
import { get as _get } from 'lodash';
import { pointerToPath } from '@stoplight/json';

export function resolveRuntimeExpressions(input: string, request: IHttpRequest, response: IHttpResponse) {
  // replace runtime expression placeholders (eg. {$method}) with the resolved values
  return input.replace(/{(.+?)}/g, (_, expr) =>
    pipe(
      resolveRuntimeExpression(expr, request, response),
      Option.getOrElse(() => '')
    )
  );
}

export function resolveRuntimeExpression(
  expr: string,
  request: IHttpRequest,
  response: IHttpResponse
): Option.Option<string> {
  const parts = expr.split(/[.#]/);

  function isPart(idx: number, type: string) {
    return pipe(
      lookup(idx, parts),
      Option.chain(part =>
        pipe(
          part,
          Option.fromPredicate(part => part === type)
        )
      )
    );
  }

  function tryMethod() {
    return pipe(
      isPart(0, '$method'),
      Option.map(() => String(request.method))
    );
  }

  function tryStatusCode() {
    return pipe(
      isPart(0, '$statusCode'),
      Option.map(() => String(response.statusCode))
    );
  }

  function tryRequestHeader() {
    return pipe(
      isPart(1, 'header'),
      Option.chain(() => lookup(2, parts)),
      Option.chain(part => Option.fromNullable(request.headers && request.headers[part]))
    );
  }

  function tryRequestQuery() {
    return pipe(
      isPart(1, 'query'),
      Option.chain(() => lookup(2, parts)),
      Option.chain(part => Option.fromNullable(request.url.query && request.url.query[part]))
    );
  }

  function tryRequestBody() {
    return pipe(
      isPart(1, 'body'),
      Option.chain(() => readBody(request))
    );
  }

  function tryResponseHeader() {
    return pipe(
      isPart(1, 'header'),
      Option.chain(() => lookup(2, parts)),
      Option.chain(part => Option.fromNullable(response.headers && response.headers[part]))
    );
  }

  function tryResponseBody() {
    return pipe(
      isPart(1, 'body'),
      Option.chain(() => readBody(response))
    );
  }

  function readBody(reqRes: IHttpRequest | IHttpResponse) {
    return pipe(
      Option.fromNullable(reqRes.body),
      Option.chain(body =>
        pipe(
          lookup(2, parts),
          Option.chain(part => Option.tryCatch(() => pointerToPath('#' + part))),
          Option.chain(path => Option.fromNullable(_get(body, path)))
        )
      )
    );
  }

  return pipe(
    tryMethod(),
    Option.alt(tryStatusCode),
    Option.alt(() =>
      pipe(
        isPart(0, '$request'),
        Option.chain(() =>
          pipe(
            tryRequestHeader(),
            Option.alt(tryRequestQuery),
            Option.alt(tryRequestBody)
          )
        )
      )
    ),
    Option.alt(() =>
      pipe(
        isPart(0, '$response'),
        Option.chain(() =>
          pipe(
            tryResponseHeader(),
            Option.alt(tryResponseBody)
          )
        )
      )
    )
  );
}
