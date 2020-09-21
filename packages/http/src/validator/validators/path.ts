import { HttpParamStyles, IHttpPathParam } from '@stoplight/types';
import { IHttpNameValue } from '../../types';
import { validate as validateParams } from './params';
import { path } from '../deserializers';

export const validate = (target: IHttpNameValue, specs: IHttpPathParam[]) =>
  validateParams(target, specs)({ registry: path, prefix: 'path', style: HttpParamStyles.Simple });
