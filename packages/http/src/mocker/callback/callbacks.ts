import { IHttpCallbackOperation, IHttpOperationRequest } from '@stoplight/types';
import { resolveRuntimeExpressions } from '../../util/runtimeExpression';
import { IHttpRequest, IHttpResponse } from '../../types';
import fetch  from 'node-fetch';
import * as Option from 'fp-ts/lib/Option';
import * as Either from 'fp-ts/lib/Either';
import { reduce } from 'fp-ts/lib/Array';
import * as TaskEither from 'fp-ts/lib/TaskEither';
import { head } from 'fp-ts/lib/Array';
import { pipe } from 'fp-ts/lib/pipeable';
import { generate as generateHttpParam } from '../generator/HttpParamGenerator';
import { validateOutput } from '../../validator';
import { parseResponse } from '../../util/response';

export function runCallback({ callback, request, response }: { callback: IHttpCallbackOperation, request: IHttpRequest, response: IHttpResponse }) {
  const { url, ...requestInit } = assembleRequest({ resource: callback, request, response });

  return pipe(
    TaskEither.tryCatch(() => fetch(url, requestInit), Either.toError),
    TaskEither.chain(parseResponse),
    TaskEither.map(element => validateOutput({ resource: callback, element })),
  );
}

function assembleRequest({ resource, request, response }: { resource: IHttpCallbackOperation, request: IHttpRequest, response: IHttpResponse }) {
  return {
    url: resolveRuntimeExpressions(resource.path, request, response),
    headers: Option.toUndefined(assembleHeaders(resource.request)),
    body: Option.toUndefined(assembleBody(resource.request)),
    method: resource.method,
  };
}

function assembleBody(request?: IHttpOperationRequest): Option.Option<string> {
  return pipe(
    Option.fromNullable(request && request.body && request.body.contents),
    Option.chain(head),
    Option.chain(generateHttpParam),
    Option.map(JSON.stringify),
  );
}

function assembleHeaders(request?: IHttpOperationRequest): Option.Option<{ [key: string]: string }> {
  return pipe(
    Option.fromNullable(request && request.headers),
    Option.map(params => pipe(
      params,
      reduce({}, (headers, param) => {
        return pipe(
          param,
          generateHttpParam,
          Option.fold(() => headers, value => ({ ...headers, [param.name]: value }))
        )
      }),
    )),
  );
}
