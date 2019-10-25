import { HttpParamStyles } from '@stoplight/types';

import { HttpParamDeserializerRegistry } from './registry';
import {
  DeepObjectStyleDeserializer,
  DelimitedStyleDeserializer,
  FormStyleDeserializer,
  SimpleStyleDeserializer,
} from './style';
import { LabelStyleDeserializer } from './style/label';
import { MatrixStyleDeserializer } from './style/matrix';

export const header = new HttpParamDeserializerRegistry([new SimpleStyleDeserializer()]);

export const query = new HttpParamDeserializerRegistry([
  new FormStyleDeserializer(),
  new DelimitedStyleDeserializer('%20', HttpParamStyles.SpaceDelimited),
  new DelimitedStyleDeserializer('|', HttpParamStyles.PipeDelimited),
  new DelimitedStyleDeserializer(',', HttpParamStyles.CommaDelimited),
  new DeepObjectStyleDeserializer(),
]);

export const path = new HttpParamDeserializerRegistry([
  new SimpleStyleDeserializer(),
  new LabelStyleDeserializer(),
  new MatrixStyleDeserializer(),
]);

export const body = query;
