import { HttpParamStyles } from '@stoplight/types';
import { IHttpNameValues, JSONSchema } from '../../../types';
import { IHttpQueryParamStyleDeserializer } from '../types';

export class DelimitedStyleDeserializer implements IHttpQueryParamStyleDeserializer {
  constructor(
    private readonly separator: string,
    private readonly styleName:
      | HttpParamStyles.PipeDelimited
      | HttpParamStyles.SpaceDelimited
      | HttpParamStyles.CommaDelimited,
  ) {}
  public supports(style: HttpParamStyles) {
    return style === this.styleName;
  }

  public deserialize(name: string, parameters: IHttpNameValues, schema?: JSONSchema, explode?: boolean) {
    const type = schema ? schema.type : undefined;
    const values = parameters[name];

    if (type === 'array') {
      return explode ? this.deserializeImplodeArray(values) : this.deserializeArray(values);
    } else {
      throw new Error('Space/pipe/comma.. delimited style is only applicable to array parameter');
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

    return value ? value.split(this.separator) : '';
  }
}
