import { HttpParamStyles, IHttpPathParam } from '@stoplight/types';
import type { IHttpNameValue } from '../../types';
import { validateParams } from './params';
import { path } from '../deserializers';

export const validate = (target: IHttpNameValue, specs: IHttpPathParam[], bundle?: unknown) =>
  validateParams(target, specs, bundle)({ deserializers: path, prefix: 'path', defaultStyle: HttpParamStyles.Simple });
