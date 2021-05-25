import { HttpParamStyles, IHttpPathParam } from '@stoplight/types';
import { IHttpNameValue } from '../../types';
import { validateParams } from './params';
import { header } from '../deserializers';

export const validate = (target: IHttpNameValue, specs: IHttpPathParam[], bundle?: unknown) =>
  validateParams(
    target,
    specs,
    bundle
  )({ deserializers: header, prefix: 'header', defaultStyle: HttpParamStyles.Simple });
