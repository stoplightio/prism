import { HttpParamStyles, IHttpPathParam } from '@stoplight/types';
import { IHttpNameValue, JSONSchema } from '../../types';
import { validateParams } from './params';
import { header } from '../deserializers';

export const validate = (
  target: IHttpNameValue,
  specs: IHttpPathParam[],
  bundle?: unknown,
  validatingSchema?: JSONSchema
) =>
  validateParams(
    target,
    specs,
    bundle,
    validatingSchema
  )({ deserializers: header, prefix: 'header', defaultStyle: HttpParamStyles.Simple });
