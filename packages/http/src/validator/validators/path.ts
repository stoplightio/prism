import { HttpParamStyles, IHttpPathParam, Dictionary } from '@stoplight/types';
import { IHttpNameValue } from '../../types';
import { deserializeFn } from '../deserializers/types';
import { HttpParamsValidator } from './params';

export class HttpPathValidator extends HttpParamsValidator<IHttpNameValue> {
  constructor(
    registry: Dictionary<deserializeFn<IHttpNameValue>>,
    prefix: string,
    style: HttpParamStyles = HttpParamStyles.Simple
  ) {
    super(registry, prefix, style);
  }
  public validate(target: IHttpNameValue, specs: IHttpPathParam[]) {
    return super.validate(target, specs);
  }
}
