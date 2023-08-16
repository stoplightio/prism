import { HttpParamStyles, IHttpQueryParam } from '@stoplight/types';
import type { IHttpNameValues } from '../../types';
import { validateParams } from './params';
import { query } from '../deserializers';
import { ValidationContext } from './types';

export const validate = (
  target: IHttpNameValues,
  specs: IHttpQueryParam[],
  context: ValidationContext,
  bundle?: unknown
) =>
  validateParams(
    target,
    specs,
    context,
    bundle
  )({ deserializers: query, prefix: 'query', defaultStyle: HttpParamStyles.Form });
