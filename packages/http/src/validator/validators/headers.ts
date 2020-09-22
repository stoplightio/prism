import { HttpParamStyles, IHttpPathParam } from '@stoplight/types';
import { IHttpNameValue } from '../../types';
import { validate as validateParams } from './params';
import { header } from '../deserializers';

export const validate = (target: IHttpNameValue, specs: IHttpPathParam[]) =>
  validateParams(target, specs)({ deserializers: header, prefix: 'header', style: HttpParamStyles.Simple });
