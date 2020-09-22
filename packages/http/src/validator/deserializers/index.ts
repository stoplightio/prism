import { deserializeSimpleStyle as simple } from './style/simple';
import { deserializeFormStyle as form } from './style/form';
import { deserializeDeepObjectStyle as deepObject } from './style/deepObject';
import { deserializeLabelStyle as label } from './style/label';
import { deserializeMatrixStyle as matrix } from './style/matrix';
import { createDelimitedDeserializerStyle as delimited } from './style/delimited';

export const header = { simple };
export const query = {
  form,
  spaceDelimited: delimited('%20'),
  pipeDelimited: delimited('|'),
  commaDelimited: delimited(','),
  deepObject,
};
export const path = { simple, label, matrix };
export const body = query;
