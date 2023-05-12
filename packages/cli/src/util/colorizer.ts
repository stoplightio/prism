import { Dictionary } from '@stoplight/types';
import { isArray, mapValues } from 'lodash';

export type ValuesTransformer = (values: Dictionary<unknown>) => Dictionary<string | string[] | object>;

export const PRE_PARAM_VALUE_TAG = '~pre~';
export const POST_PARAM_VALUE_TAG = '~post~';

const taggedParamsValues = new RegExp(`${PRE_PARAM_VALUE_TAG}(.*?)${POST_PARAM_VALUE_TAG}`, 'gm');

export const transformPathParamsValues = (path: string, transform: (aString: string) => string): string => {
  return path.replace(taggedParamsValues, transform('$1'));
};

export const attachTagsToParamsValues: ValuesTransformer = values => {
  return mapValues(values, attachPrePostTags);
};

const attachPrePostTags = (paramValue: unknown) => {
  if (isArray(paramValue)) {
    return paramValue.map(v => `${PRE_PARAM_VALUE_TAG}${v}${POST_PARAM_VALUE_TAG}`);
  } else if (paramValue && typeof paramValue === 'object') {
    for (const key of Object.keys(paramValue)) {
      paramValue[key] = `${PRE_PARAM_VALUE_TAG}${paramValue[key]}${POST_PARAM_VALUE_TAG}`;
    }
    return paramValue;
  } else {
    return `${PRE_PARAM_VALUE_TAG}${paramValue}${POST_PARAM_VALUE_TAG}`;
  }
};
