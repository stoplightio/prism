import { IHttpRequest, IHttpResponse } from '../types';
import * as O from 'fp-ts/lib/Option';
import { lookup } from 'fp-ts/lib/Array';
import { pipe } from 'fp-ts/lib/pipeable';
import { get as _get } from 'lodash';
import { pointerToPath } from '@stoplight/json';

export function resolveRuntimeExpressions(input: string, request: IHttpRequest, response: IHttpResponse) {
  // replace runtime expression placeholders (eg. {$method}) with the resolved values
  return input.replace(/{(.+?)}/g, (_, expr) =>
    pipe(
      resolveRuntimeExpression(expr, request, response),
      O.getOrElse(() => '')
    )
  );
}

export function resolveRuntimeExpression(
  expr: string,
  request: IHttpRequest,
  response: IHttpResponse
): O.Option<string> {
  const parts = expr.split(/[.#]/);

  return pipe(
    tryMethod(),
    O.alt(tryStatusCode),
    O.alt(() =>
      pipe(
        isPart(0, '$request'),
        O.chain(() => pipe(tryRequestHeader(), O.alt(tryRequestQuery), O.alt(tryRequestBody)))
      )
    ),
    O.alt(() =>
      pipe(
        isPart(0, '$response'),
        O.chain(() => pipe(tryResponseHeader(), O.alt(tryResponseBody)))
      )
    )
  );

  function isPart(idx: number, type: string) {
    return pipe(
      lookup(idx, parts),
      O.chain(part =>
        pipe(
          part,
          O.fromPredicate(part => part === type)
        )
      )
    );
  }

  function tryMethod() {
    return pipe(
      isPart(0, '$method'),
      O.map(() => String(request.method))
    );
  }

  function tryStatusCode() {
    return pipe(
      isPart(0, '$statusCode'),
      O.map(() => String(response.statusCode))
    );
  }

  function tryRequestHeader() {
    return pipe(
      isPart(1, 'header'),
      O.chain(() => lookup(2, parts)),
      O.chain(part =>
        pipe(
          O.fromNullable(request.headers),
          O.mapNullable(headers => headers[part])
        )
      )
    );
  }

  function tryRequestQuery() {
    return pipe(
      isPart(1, 'query'),
      O.chain(() => lookup(2, parts)),
      O.chain(part =>
        pipe(
          O.fromNullable(request.url.query),
          O.mapNullable(query => query[part])
        )
      )
    );
  }

  function tryRequestBody() {
    return pipe(
      isPart(1, 'body'),
      O.chain(() => readBody(request.body))
    );
  }

  function tryResponseHeader() {
    return pipe(
      isPart(1, 'header'),
      O.chain(() => lookup(2, parts)),
      O.chain(part =>
        pipe(
          O.fromNullable(response.headers),
          O.mapNullable(headers => headers[part])
        )
      )
    );
  }

  function tryResponseBody() {
    return pipe(
      isPart(1, 'body'),
      O.chain(() => readBody(response.body))
    );
  }

  function readBody(body: unknown) {
    return pipe(
      O.fromNullable(body),
      O.chain(body =>
        pipe(
          lookup(2, parts),
          O.chain(part => O.tryCatch(() => pointerToPath('#' + part))),
          O.chain(path => O.fromNullable(_get(body, path)))
        )
      )
    );
  }
}
