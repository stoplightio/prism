import { HttpParamStyles, IHttpPathParam } from '@stoplight/types';
import type { IHttpNameValue } from '../../types';
import { validateParams } from './params';
import { path } from '../deserializers';
import { ValidationContext } from './types';

export const validate = (
  target: IHttpNameValue,
  specs: IHttpPathParam[],
  context: ValidationContext,
  bundle?: unknown
) =>
  validateParams(
    target,
    specs,
    context,
    bundle
  )({ deserializers: path, prefix: 'path', defaultStyle: HttpParamStyles.Simple });
