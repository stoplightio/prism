import { ProblemJson } from '@stoplight/prism-core';

export const NOT_ACCEPTABLE: Omit<ProblemJson, 'detail'> = {
  type: 'NOT_ACCEPTABLE',
  title: 'Unable to generate the response in the defined format',
  status: 406,
};
