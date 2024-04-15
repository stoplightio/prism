import { createInstance } from './index';
import { getHttpOperationsFromSpec } from './utils/operations';
import { IHttpConfig, IHttpRequest, IHttpResponse } from './types';
import type { Logger } from 'pino';
import { pipe } from 'fp-ts/function';
import { isRight, isLeft } from 'fp-ts/lib/Either';
import { IPrismOutput } from '@stoplight/prism-core';

export type PrismOkResult = {
  result: 'ok';
  response: IPrismOutput<IHttpResponse>;
};

export type PrismErrorResult = {
  result: 'error';
  error: Error;
};

export async function createAndCallPrismInstanceWithSpec(
  spec: string | object,
  options: IHttpConfig,
  request: IHttpRequest,
  logger: Logger
): Promise<PrismErrorResult | PrismOkResult> {
  const operations = await getHttpOperationsFromSpec(spec);
  const prism = createInstance(options, { logger });
  const result = await pipe(prism.request(request, operations))();
  if (isRight(result)) {
    return { result: 'ok', response: result.right };
  }
  if (isLeft(result)) {
    return { result: 'error', error: result.left };
  }
  throw new Error('Unexpected Result');
}
