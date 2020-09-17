import simple from './style/simple';
import form from './style/form';
import deepObject from './style/deepObject';
import label from './style/label';
import matrix from './style/matrix';
import delimited from './style/delimited';

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
