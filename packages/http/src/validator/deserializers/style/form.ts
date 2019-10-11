import { HttpParamStyles } from '@stoplight/types';

import { IHttpNameValues, JSONSchema } from '../../../types';
import { IHttpQueryParamStyleDeserializer } from '../types';
import { createObjectFromKeyValList } from './utils';

export class FormStyleDeserializer implements IHttpQueryParamStyleDeserializer {
  public supports(style: HttpParamStyles) {
    return style === HttpParamStyles.Form;
  }

  public deserialize(name: string, parameters: IHttpNameValues, schema?: JSONSchema, explode = true) {
    const type = schema ? schema.type : undefined;
    const values = parameters[name];

    if (!values) return undefined;

    if (type === 'array') {
      return explode ? this.deserializeImplodeArray(values) : this.deserializeArray(values);
    } else if (type === 'object') {
      return explode ? this.deserializeImplodeObject(parameters, schema || {}) : this.deserializeObject(values);
    } else {
      return values;
    }
  }

  private deserializeImplodeArray(value: string | string[]) {
    return Array.isArray(value) ? value : [value];
  }

  private deserializeArray(value: string | string[]) {
    if (Array.isArray(value)) {
      // last query param is taken into account
      value = value[value.length - 1];
    }

    return value.split(',');
  }

  private deserializeImplodeObject(parameters: IHttpNameValues, schema: JSONSchema) {
    const properties = schema.properties || {};

    return Object.keys(parameters).reduce((result: object, key) => {
      const value = parameters[key];

      if (!Object.prototype.hasOwnProperty.call(properties, key)) {
        return result;
      }

      return { ...result, [key]: value };
    }, {});
  }

  private deserializeObject(value: string | string[]) {
    if (Array.isArray(value)) {
      // last query param is taken into account
      value = value[value.length - 1];
    }

    return createObjectFromKeyValList(value.split(','));
  }
}
