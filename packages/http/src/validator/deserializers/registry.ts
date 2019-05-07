import { HttpParamStyles } from '@stoplight/types';

import { IHttpParamDeserializerRegistry, IHttpParamStyleDeserializer } from './types';

export class HttpParamDeserializerRegistry<Parameters> implements IHttpParamDeserializerRegistry<Parameters> {
  constructor(private deserializers: Array<IHttpParamStyleDeserializer<Parameters>>) {}

  public get(style: HttpParamStyles): IHttpParamStyleDeserializer<Parameters> | undefined {
    const deserializer = this.deserializers.find(d => d.supports(style));

    if (!deserializer) {
      return;
    }

    return deserializer;
  }
}
