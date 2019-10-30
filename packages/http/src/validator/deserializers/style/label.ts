import { HttpParamStyles } from '@stoplight/types';

import { IHttpNameValue, JSONSchema } from '../../../types';
import { IHttpHeaderParamStyleDeserializer } from '../types';
import { createObjectFromKeyValList } from './utils';

export class LabelStyleDeserializer implements IHttpHeaderParamStyleDeserializer {
  public supports(style: HttpParamStyles) {
    return style === HttpParamStyles.Label;
  }

  public deserialize(name: string, parameters: IHttpNameValue, schema?: JSONSchema, explode = false): any {
    const type = schema ? schema.type : 'undefined';

    if (!parameters[name].startsWith('.')) {
      throw new Error('Label serialization style requires parameter to be prefixed with "."');
    }

    const value = parameters[name].substr(1);

    if (type === 'array') {
      return this.deserializeArray(value, explode);
    } else if (type === 'object') {
      return explode ? this.deserializeImplodeObject(value) : this.deserializeObject(value);
    } else {
      return value;
    }
  }

  private deserializeArray(value: string, explode: boolean) {
    return value === '' ? [] : value.split(explode ? '.' : ',');
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
