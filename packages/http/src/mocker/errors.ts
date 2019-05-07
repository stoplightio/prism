import { Omit } from '@stoplight/types';
import { ProblemJson } from '../types';

export const INVALID_REQUEST_PAYLOAD: Omit<ProblemJson, 'detail'> = {
  name: 'INVALID_REQUEST_PAYLOAD',
  title: 'Invalid request body payload',
  status: 422,
};
