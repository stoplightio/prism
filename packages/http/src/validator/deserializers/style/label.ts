import { IHttpNameValue, JSONSchema } from '../../../types';
import { createObjectFromKeyValList } from './utils';

export function deserializeLabelStyle(
  name: string,
  parameters: IHttpNameValue,
  schema?: JSONSchema,
  explode = false
): unknown {
  const type = schema ? schema.type : 'undefined';

  if (!parameters[name].startsWith('.')) {
    throw new Error('Label serialization style requires parameter to be prefixed with "."');
  }

  const value = parameters[name].substr(1);

  if (type === 'array') {
    return deserializeArray(value, explode);
  } else if (type === 'object') {
    return explode ? deserializeImplodeObject(value) : deserializeObject(value);
  } else {
    return value;
  }
}

function deserializeArray(value: string, explode: boolean) {
  return value === '' ? [] : value.split(explode ? '.' : ',');
}

function deserializeImplodeObject(value: string) {
  return value.split(',').reduce((result: object, pair) => {
    const [k, v] = pair.split('=');
    return { ...result, [k]: v };
  }, {});
}

function deserializeObject(value: string) {
  return createObjectFromKeyValList(value.split(','));
}
