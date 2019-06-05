import { HttpParamStyles } from '@stoplight/types';
import { JSONSchema4, JSONSchema6, JSONSchema7 } from 'json-schema';

import { IHttpNameValues } from '../../../types';
import { IHttpQueryParamStyleDeserializer } from '../types';
import { createObjectFromKeyValList } from './utils';

export class FormStyleDeserializer implements IHttpQueryParamStyleDeserializer {
  public supports(style: HttpParamStyles) {
    return style === HttpParamStyles.Form;
  }

  public deserialize(
    name: string,
    parameters: IHttpNameValues,
    schema?: JSONSchema4 | JSONSchema6 | JSONSchema7,
    explode: boolean = true,
  ) {
    const type = schema ? schema.type : undefined;
    const values = parameters[name];

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

  private deserializeImplodeObject(parameters: IHttpNameValues, schema: JSONSchema4 | JSONSchema6 | JSONSchema7) {
    const properties = schema.properties || {};

    return Object.keys(parameters).reduce((result: object, key) => {
      const value = parameters[key];

      if (!properties.hasOwnProperty(key)) {
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
