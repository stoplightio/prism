import { Omit } from '@stoplight/types';
import { ProblemJson } from '../types';

export const UNPROCESSABLE_ENTITY: Omit<ProblemJson, 'detail'> = {
  name: 'https://stoplight.io/prism/errors#UNPROCESSABLE_ENTITY',
  title: 'Invalid request body payload',
  status: 422,
};
