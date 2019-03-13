// @ts-ignore
import * as jsf from 'json-schema-faker';

import { IExampleGenerator } from './IExampleGenerator';

export class JSONSchemaExampleGenerator implements IExampleGenerator<any> {
  public async generate(schema: any, mediaType: string): Promise<string> {
    const example = await jsf.resolve(JSON.parse(JSON.stringify(schema)));
    return this.transform(mediaType, example);
  }

  private transform(mediaType: string, input: object): string {
    switch (mediaType) {
      case 'application/json':
        return JSON.stringify(input);

      default:
        throw new Error(`Unknown media type '${mediaType}'`);
    }
  }
}
