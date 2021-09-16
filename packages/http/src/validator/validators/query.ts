import { HttpParamStyles, IHttpQueryParam } from '@stoplight/types';
import type { IHttpNameValues, JSONSchema } from '../../types';
import { validateParams } from './params';
import { query } from '../deserializers';

export const validate = (target: IHttpNameValues, specs: IHttpQueryParam[], validatingSchema: JSONSchema) =>
  validateParams(
    target,
    specs,
    validatingSchema
  )({ deserializers: query, prefix: 'query', defaultStyle: HttpParamStyles.Form });
