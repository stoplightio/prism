import { IHttpNameValues, JSONSchema } from '../../../types';
import { createObjectFromKeyValList } from './utils';

export function deserializeFormStyle(name: string, parameters: IHttpNameValues, schema?: JSONSchema, explode = true) {
  const type = schema ? schema.type : undefined;
  const values = parameters[name];

  if (!values) return undefined;

  if (type === 'array') {
    return explode ? deserializeImplodeArray(values) : deserializeArray(values);
  } else if (type === 'object') {
    return explode ? deserializeImplodeObject(parameters, schema || {}) : deserializeObject(values);
  } else {
    return values;
  }
}

function deserializeImplodeArray(value: string | string[]) {
  return Array.isArray(value) ? value : [value];
}

function deserializeArray(value: string | string[]) {
  if (Array.isArray(value)) {
    // last query param is taken into account
    value = value[value.length - 1];
  }

  return value.split(',');
}

function deserializeImplodeObject(parameters: IHttpNameValues, schema: JSONSchema) {
  const properties = schema.properties || {};

  return Object.keys(parameters).reduce((result: object, key) => {
    const value = parameters[key];

    if (!Object.prototype.hasOwnProperty.call(properties, key)) {
      return result;
    }

    return { ...result, [key]: value };
  }, {});
}

function deserializeObject(value: string | string[]) {
  if (Array.isArray(value)) {
    // last query param is taken into account
    value = value[value.length - 1];
  }

  return createObjectFromKeyValList(value.split(','));
}
