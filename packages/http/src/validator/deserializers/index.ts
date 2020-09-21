import simple from './style/simple';
import form from './style/form';
import deepObject from './style/deepObject';
import label from './style/label';
import matrix from './style/matrix';
import delimited from './style/delimited';
import type { deserializeFn } from './types';
import type { IHttpNameValue, IHttpNameValues } from '../../index';
import type { Dictionary } from '@stoplight/types';

export const header: Dictionary<deserializeFn<IHttpNameValue>, 'simple'> = { simple };
export const query: Dictionary<
  deserializeFn<IHttpNameValues>,
  'form' | 'spaceDelimited' | 'pipeDelimited' | 'commaDelimited' | 'deepObject'
> = {
  form,
  spaceDelimited: delimited('%20'),
  pipeDelimited: delimited('|'),
  commaDelimited: delimited(','),
  deepObject,
};
export const path: Dictionary<deserializeFn<IHttpNameValue>, 'simple' | 'label' | 'matrix'> = { simple, label, matrix };
export const body = query;
