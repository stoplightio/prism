import { Dictionary, HttpParamStyles } from '@stoplight/types';

import { IHttpNameValue, JSONSchema } from '../../../types';
import { IHttpHeaderParamStyleDeserializer } from '../types';
import { createObjectFromKeyValList } from './utils';

export class MatrixStyleDeserializer implements IHttpHeaderParamStyleDeserializer {
  public supports(style: HttpParamStyles) {
    return style === HttpParamStyles.Matrix;
  }

  public deserialize(name: string, parameters: IHttpNameValue, schema?: JSONSchema, explode = false): any {
    const type = schema ? schema.type : 'undefined';

    if (!parameters[name].startsWith(';')) {
      throw new Error('Matrix serialization style requires parameter to be prefixed with ";"');
    }

    const value = parameters[name].substr(1);

    if (type === 'array') {
      return explode ? this.deserializeImplodeArray(name, value) : this.deserializeArray(name, value);
    } else if (type === 'object') {
      return explode ? this.deserializeImplodeObject(value) : this.deserializeObject(name, value);
    } else {
      return this.deserializePrimitive(name, value);
    }
  }

  private deserializePrimitive(name: string, value: string) {
    const prefix = name + '=';
    if (!value.startsWith(prefix)) {
      throw new Error('Matrix serialization style requires parameter to be prefixed with name');
    }

    return value.substr(prefix.length);
  }

  private deserializeArray(name: string, value: string) {
    const raw = this.deserializePrimitive(name, value);
    return raw === '' ? [] : raw.split(',');
  }

  private deserializeImplodeArray(name: string, value: string) {
    if (value === '') {
      return [];
    }

    return value.split(';').map(part => this.deserializePrimitive(name, part));
  }

  private deserializeImplodeObject(value: string) {
    return value.split(';').reduce((result: Dictionary<string, string>, pair) => {
      const [k, v] = pair.split('=');
      return { ...result, [k]: v };
    }, {});
  }

  private deserializeObject(name: string, value: string) {
    return createObjectFromKeyValList(this.deserializePrimitive(name, value).split(','));
  }
}
