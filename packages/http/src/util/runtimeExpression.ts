import { IHttpRequest, IHttpResponse } from '../types';
import * as Option from 'fp-ts/lib/Option';
import { head, lookup } from 'fp-ts/lib/Array';
import { pipe } from 'fp-ts/lib/pipeable';
import { get as _get } from 'lodash';
import { pointerToPath } from '@stoplight/json';

export function resolveRuntimeExpressions(input: string, request: IHttpRequest, response: IHttpResponse) {
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

  function tryMethod() {
    return pipe(
      head(parts),
      Option.chain(part =>
        pipe(
          part,
          Option.fromPredicate(part => part === '$method')
        )
      ),
      Option.map(() => String(request.method))
    );
  }

  function tryStatusCode() {
    return pipe(
      head(parts),
      Option.chain(part =>
        pipe(
          part,
          Option.fromPredicate(part => part === '$statusCode')
        )
      ),
      Option.map(() => String(response.statusCode))
    );
  }

  function tryRequestHeader() {
    return pipe(
      lookup(1, parts),
      Option.chain(part =>
        pipe(
          part,
          Option.fromPredicate(part => part === 'header')
        )
      ),
      Option.chain(() => lookup(2, parts)),
      Option.chain(part => Option.fromNullable(request.headers && request.headers[part]))
    );
  }

  function tryRequestQuery() {
    return pipe(
      lookup(1, parts),
      Option.chain(part =>
        pipe(
          part,
          Option.fromPredicate(part => part === 'query')
        )
      ),
      Option.chain(() => lookup(2, parts)),
      Option.chain(part => Option.fromNullable(request.url.query && request.url.query[part]))
    );
  }

  function tryRequestBody() {
    return pipe(
      lookup(1, parts),
      Option.chain(part =>
        pipe(
          part,
          Option.fromPredicate(part => part === 'body')
        )
      ),
      Option.chain(() =>
        pipe(
          Option.fromNullable(request.body),
          Option.chain(body =>
            pipe(
              lookup(2, parts),
              Option.chain(part => Option.tryCatch(() => pointerToPath('#' + part))),
              Option.chain(path => Option.fromNullable(_get(body, path)))
            )
          )
        )
      )
    );
  }

  function tryResponseHeader() {
    return pipe(
      lookup(1, parts),
      Option.chain(part =>
        pipe(
          part,
          Option.fromPredicate(part => part === 'header')
        )
      ),
      Option.chain(() => lookup(2, parts)),
      Option.chain(part => Option.fromNullable(response.headers && response.headers[part]))
    );
  }

  function tryResponseBody() {
    return pipe(
      lookup(1, parts),
      Option.chain(part =>
        pipe(
          part,
          Option.fromPredicate(part => part === 'body')
        )
      ),
      Option.chain(() =>
        pipe(
          Option.fromNullable(response.body),
          Option.chain(body =>
            pipe(
              lookup(2, parts),
              Option.chain(part => Option.tryCatch(() => pointerToPath('#' + part))),
              Option.chain(path => Option.fromNullable(_get(body, path)))
            )
          )
        )
      )
    );
  }

  function tryRequest() {
    return pipe(
      head(parts),
      Option.chain(part =>
        pipe(
          part,
          Option.fromPredicate(part => part === '$request')
        )
      ),
      Option.chain(() =>
        pipe(
          tryRequestHeader(),
          Option.alt(tryRequestQuery),
          Option.alt(tryRequestBody)
        )
      )
    );
  }

  function tryResponse() {
    return pipe(
      head(parts),
      Option.chain(part =>
        pipe(
          part,
          Option.fromPredicate(part => part === '$response')
        )
      ),
      Option.chain(tryResponseHeader),
      Option.alt(tryResponseBody)
    );
  }

  return pipe(
    tryMethod(),
    Option.alt(tryStatusCode),
    Option.alt(tryRequest),
    Option.alt(tryResponse)
  );
}
