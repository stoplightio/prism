import { mapValues, isArray } from 'lodash';
import { Dictionary } from '@stoplight/types';

export type ValuesTransformer = (values: Dictionary<unknown>) => Dictionary<string | string[]>;

export const PRE_PARAM_VALUE_TAG = '~pre~';
export const POST_PARAM_VALUE_TAG = '~post~';

export const transformPathParamsValues = ((
  taggedParamsValues: RegExp,
  path: string,
  transform: (aString: string) => string
): string => {
  return path.replace(taggedParamsValues, transform('$2'));
}).bind({}, new RegExp(`(${PRE_PARAM_VALUE_TAG})(.*?)(${POST_PARAM_VALUE_TAG})`, 'gm'));

export const attachTagsToParamsValues: ValuesTransformer = values => {
  return mapValues(values, attachPrePostTags);
};

const attachPrePostTags = (paramValue: unknown) => {
  return isArray(paramValue)
    ? paramValue.map(v => `${PRE_PARAM_VALUE_TAG}${v}${POST_PARAM_VALUE_TAG}`)
    : `${PRE_PARAM_VALUE_TAG}${paramValue}${POST_PARAM_VALUE_TAG}`;
};
