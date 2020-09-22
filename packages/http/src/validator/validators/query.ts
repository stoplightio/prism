import { HttpParamStyles, IHttpQueryParam } from '@stoplight/types';
import type { IHttpNameValues } from '../../types';
import { validate as validateParams } from './params';
import { query } from '../deserializers';

export const validate = (target: IHttpNameValues, specs: IHttpQueryParam[]) =>
  validateParams(target, specs)({ deserializers: query, prefix: 'query', defaultStyle: HttpParamStyles.Form });
