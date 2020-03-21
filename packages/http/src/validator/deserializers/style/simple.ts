import { HttpParamStyles } from '@stoplight/types';

import { IHttpNameValue, JSONSchema } from '../../../types';
import { IHttpHeaderParamStyleDeserializer } from '../types';
import { createObjectFromKeyValList } from './utils';

export class SimpleStyleDeserializer implements IHttpHeaderParamStyleDeserializer {
  public supports(style: HttpParamStyles) {
    return style === HttpParamStyles.Simple;
  }

  public deserialize(name: string, parameters: IHttpNameValue, schema?: JSONSchema, explode?: boolean): unknown {
    const type = schema ? schema.type : 'undefined';
    const value = parameters[name];

    if (type === 'array') {
      return this.deserializeArray(value);
    } else if (type === 'object') {
      return explode ? this.deserializeImplodeObject(value) : this.deserializeObject(value);
    } else {
      return value;
    }
  }

  private deserializeArray(value: string) {
    return value === '' ? [] : value.split(',');
  }

  private deserializeImplodeObject(value: string) {
    return value.split(',').reduce((result: object, pair) => {
      const [k, v] = pair.split('=');
      return { ...result, [k]: v };
    }, {});
  }

  private deserializeObject(value: string) {
    return createObjectFromKeyValList(value.split(','));
  }
}
