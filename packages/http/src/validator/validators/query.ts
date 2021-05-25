import { HttpParamStyles, IHttpQueryParam } from '@stoplight/types';
import type { IHttpNameValues } from '../../types';
import { validateParams } from './params';
import { query } from '../deserializers';

export const validate = (target: IHttpNameValues, specs: IHttpQueryParam[], bundle?: unknown) =>
  validateParams(target, specs, bundle)({ deserializers: query, prefix: 'query', defaultStyle: HttpParamStyles.Form });
