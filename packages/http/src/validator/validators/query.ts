import { HttpParamStyles, IHttpQueryParam } from '@stoplight/types';
import { IHttpNameValues } from '../../types';
import { validate as validateParams } from './params';
import { query } from '../deserializers';

export const validate = (target: IHttpNameValues, specs: IHttpQueryParam[]) =>
  validateParams(target, specs)({ registry: query, prefix: 'query', style: HttpParamStyles.Form });
