import { HttpParamStyles, IHttpQueryParam } from '@stoplight/types';
import { IHttpNameValues } from '../../types';
import { IHttpParamDeserializerRegistry } from '../deserializers/types';
import { HttpParamsValidator } from './params';

export class HttpQueryValidator extends HttpParamsValidator<IHttpNameValues> {
  constructor(
    registry: IHttpParamDeserializerRegistry<IHttpNameValues>,
    prefix: string,
    style: HttpParamStyles = HttpParamStyles.Form
  ) {
    super(registry, prefix, style);
  }
  public validate(target: IHttpNameValues, specs: IHttpQueryParam[]) {
    return super.validate(target, specs);
  }
}
