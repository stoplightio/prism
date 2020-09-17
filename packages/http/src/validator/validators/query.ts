import { HttpParamStyles, IHttpQueryParam, Dictionary } from '@stoplight/types';
import { IHttpNameValues } from '../../types';
import { deserializeFn } from '../deserializers/types';
import { HttpParamsValidator } from './params';

export class HttpQueryValidator extends HttpParamsValidator<IHttpNameValues> {
  constructor(
    registry: Dictionary<deserializeFn<IHttpNameValues>>,
    prefix: string,
    style: HttpParamStyles = HttpParamStyles.Form
  ) {
    super(registry, prefix, style);
  }
  public validate(target: IHttpNameValues, specs: IHttpQueryParam[]) {
    return super.validate(target, specs);
  }
}
