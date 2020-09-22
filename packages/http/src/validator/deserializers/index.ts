import { deserializeSimple as simple } from './style/simple';
import { deserializeForm as form } from './style/form';
import { deserializeDeepObject as deepObject } from './style/deepObject';
import { deserializeLabel as label } from './style/label';
import { deserializeMatrixStyle as matrix } from './style/matrix';
import { createDelimitedDeserializer as delimited } from './style/delimited';

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
