import { Dictionary } from '@stoplight/types';

import { IHttpNameValue, JSONSchema } from '../../../types';
import { createObjectFromKeyValList } from './utils';

export function deserializeMatrixStyle(
  name: string,
  parameters: IHttpNameValue,
  schema?: JSONSchema,
  explode = false
): unknown {
  const type = schema ? schema.type : 'undefined';

  if (!parameters[name].startsWith(';')) {
    throw new Error('Matrix serialization style requires parameter to be prefixed with ";"');
  }

  const value = parameters[name].substr(1);

  if (type === 'array') {
    return explode ? deserializeImplodeArray(name, value) : deserializeArray(name, value);
  } else if (type === 'object') {
    return explode ? deserializeImplodeObject(value) : deserializeObject(name, value);
  } else {
    return deserializePrimitive(name, value);
  }
}

function deserializePrimitive(name: string, value: string) {
  const prefix = name + '=';
  if (!value.startsWith(prefix)) {
    throw new Error('Matrix serialization style requires parameter to be prefixed with name');
  }

  return value.substr(prefix.length);
}

function deserializeArray(name: string, value: string) {
  const raw = deserializePrimitive(name, value);
  return raw === '' ? [] : raw.split(',');
}

function deserializeImplodeArray(name: string, value: string) {
  if (value === '') {
    return [];
  }

  return value.split(';').map(part => deserializePrimitive(name, part));
}

function deserializeImplodeObject(value: string) {
  return value.split(';').reduce((result: Dictionary<string>, pair) => {
    const [k, v] = pair.split('=');
    return { ...result, [k]: v };
  }, {});
}

function deserializeObject(name: string, value: string) {
  return createObjectFromKeyValList(deserializePrimitive(name, value).split(','));
}
