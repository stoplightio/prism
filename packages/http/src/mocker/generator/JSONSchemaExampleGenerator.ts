// @ts-ignore
import * as jsf from '@stoplight/json-schema-faker';
import { cloneDeep } from 'lodash';
import { IExampleGenerator } from './IExampleGenerator';

jsf.option({
  failOnInvalidTypes: false,
  failOnInvalidFormat: false,
  alwaysFakeOptionals: true,
  optionalsProbability: 1,
  fixedProbabilities: true,
  ignoreMissingRefs: true,
  useExamplesValue: true,
  useDefaultValue: true,
  maxItems: 20,
  maxLength: 100,
});

export class JSONSchemaExampleGenerator implements IExampleGenerator {
  public async generate(schema: unknown, mediaType: string): Promise<string> {
    const example = await jsf.resolve(cloneDeep(schema));
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
