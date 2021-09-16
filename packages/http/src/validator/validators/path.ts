import { HttpParamStyles, IHttpPathParam } from '@stoplight/types';
import type { IHttpNameValue } from '../../types';
import { validateParams } from './params';
import { path } from '../deserializers';
import { JSONSchema } from '../../types';

export const validate = (target: IHttpNameValue, specs: IHttpPathParam[], validatingSchema: JSONSchema) =>
  validateParams(
    target,
    specs,
    validatingSchema
  )({ deserializers: path, prefix: 'path', defaultStyle: HttpParamStyles.Simple });
