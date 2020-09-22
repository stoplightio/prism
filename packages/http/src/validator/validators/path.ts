import { HttpParamStyles, IHttpPathParam } from '@stoplight/types';
import type { IHttpNameValue } from '../../types';
import { validateParams } from './params';
import { path } from '../deserializers';

export const validate = (target: IHttpNameValue, specs: IHttpPathParam[]) =>
  validateParams(target, specs)({ deserializers: path, prefix: 'path', defaultStyle: HttpParamStyles.Simple });
