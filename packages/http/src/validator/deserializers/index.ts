import { deserializeSimpleStyle as simple } from './style/simple';
import { deserializeFormStyle as form } from './style/form';
import { deserializeDeepObjectStyle as deepObject } from './style/deepObject';
import { deserializeLabelStyle as label } from './style/label';
import { deserializeMatrixStyle as matrix } from './style/matrix';
import { createDelimitedDeserializerStyle as delimited } from './style/delimited';
import type { Dictionary } from '@stoplight/types';
import type { deserializeFn } from './types';
import type { IHttpNameValue, IHttpNameValues } from '../../';

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
