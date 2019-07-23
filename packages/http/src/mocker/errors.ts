import { ProblemJson } from '../types';

export const UNPROCESSABLE_ENTITY: Omit<ProblemJson, 'detail'> = {
  type: 'UNPROCESSABLE_ENTITY',
  title: 'Invalid request body payload',
  status: 422,
};

export const NOT_ACCEPTABLE: Omit<ProblemJson, 'detail'> = {
  type: 'NOT_ACCEPTABLE',
  title: 'The server cannot produce a representation for your accept header',
  status: 406,
};

export const NOT_FOUND: Omit<ProblemJson, 'detail'> = {
  type: 'NOT_FOUND',
  title: 'The server cannot find the requested content',
  status: 404,
};
