import { mapValues, isArray } from 'lodash';
import { Dictionary } from '@stoplight/types';

export type ValuesTransformer = (values: Dictionary<unknown>) => Dictionary<string | string[]>;

export const PRE_PARAM_VALUE_TAG = 'PRE_PARAM_VALUE_TAG';
export const POST_PARAM_VALUE_TAG = 'POST_PARAM_VALUE_TAG';

export function transformPathParamsValues(path: string, transform: (aString: string) => string): string {
  const taggedParamsValues = new RegExp(`(${PRE_PARAM_VALUE_TAG},)(.*?)(,${POST_PARAM_VALUE_TAG})`, 'gm');

  return path.replace(taggedParamsValues, transform('$2'));
}

export const attachTagsToParamsValues: ValuesTransformer = values => {
  return mapValues(values, attachPrePostTags);
};

const attachPrePostTags = (paramValue: unknown) => {
  return [PRE_PARAM_VALUE_TAG].concat(isArray(paramValue) ? paramValue : `${paramValue}`).concat(POST_PARAM_VALUE_TAG);
};
