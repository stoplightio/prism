import { ProblemJson } from '../types';

export const UNPROCESSABLE_ENTITY: Omit<ProblemJson, 'detail'> = {
  type: 'UNPROCESSABLE_ENTITY',
  title: 'Your request body is not valid and no HTTP validation response was found in the spec, so Prism is generating this error for you.',
  status: 422,
};

export const NOT_ACCEPTABLE: Omit<ProblemJson, 'detail'> = {
  type: 'NOT_ACCEPTABLE',
  title: 'The server cannot produce a representation for your accept header',
  status: 406,
};
