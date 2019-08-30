import { HttpParamStyles } from '@stoplight/types';

import { HttpParamDeserializerRegistry } from './registry';
import {
  DeepObjectStyleDeserializer,
  DelimitedStyleDeserializer,
  FormStyleDeserializer,
  SimpleStyleDeserializer,
} from './style';

export const header = new HttpParamDeserializerRegistry([new SimpleStyleDeserializer()]);

export const query = new HttpParamDeserializerRegistry([
  new FormStyleDeserializer(),
  new DelimitedStyleDeserializer('%20', HttpParamStyles.SpaceDelimited),
  new DelimitedStyleDeserializer('|', HttpParamStyles.PipeDelimited),
  new DelimitedStyleDeserializer(',', HttpParamStyles.CommaDelimited),
  new DeepObjectStyleDeserializer(),
]);

export const body = query;
