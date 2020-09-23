import { IHttpNameValues, JSONSchema } from '../../../types';

export function createDelimitedDeserializerStyle(separator: string) {
  function deserializeImplodeArray(value: string | string[]) {
    return Array.isArray(value) ? value : [value];
  }

  function deserializeArray(value: string | string[]) {
    if (Array.isArray(value)) {
      // last query param is taken into account
      value = value[value.length - 1];
    }

    return value ? value.split(separator) : '';
  }

  return function deserialize(name: string, parameters: IHttpNameValues, schema?: JSONSchema, explode = false) {
    const type = schema ? schema.type : undefined;
    const values = parameters[name];

    if (type === 'array') {
      return explode ? deserializeImplodeArray(values) : deserializeArray(values);
    } else {
      throw new Error('Space/pipe/comma.. delimited style is only applicable to array parameter');
    }
  };
}
