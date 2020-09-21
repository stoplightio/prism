import { validate as validateBody } from './body';
import { validate as validateHeaders } from './headers';
import { validate as validateQuery } from './query';
import { validate as validatePath } from './path';

const obj = { validateQuery, validatePath, validateHeaders, validateBody };

export = obj;
