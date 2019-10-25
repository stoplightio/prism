import { mapValues, uniq, isArray } from 'lodash';
import { Dictionary } from '@stoplight/types';

type ParamValue = number | string | string[] | unknown;
export type ValuesTransformer = (values: Dictionary<ParamValue>) => Dictionary<string | string[]>;

export const PRE_PARAM_VALUE_TAG = 'PRE_PARAM_VALUE_TAG';
export const POST_PARAM_VALUE_TAG = 'POST_PARAM_VALUE_TAG';

export function transformPathParamsValues(path: string, transform: (aString: string) => string): string {
  const taggedParamsValues = new RegExp(`(${PRE_PARAM_VALUE_TAG},?)(.*?)(,?${POST_PARAM_VALUE_TAG})`, 'gm');

  return path.replace(taggedParamsValues, transform('$2'));
}

export const attachTagsToParamsValues: ValuesTransformer = values => {
  return mapValues(values, attachPrePostTags);
};

const attachPrePostTags = (paramValue: ParamValue) => {
  return isArray(paramValue)
    ? [PRE_PARAM_VALUE_TAG].concat(uniq(paramValue)).concat(POST_PARAM_VALUE_TAG)
    : `${PRE_PARAM_VALUE_TAG}${paramValue}${POST_PARAM_VALUE_TAG}`;
};
