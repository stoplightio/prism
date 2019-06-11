// @ts-ignore
import { JSONSchema } from 'http/src/types';
import * as jsf from 'json-schema-faker';
import { cloneDeep } from 'lodash';

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

export async function generate(source: JSONSchema): Promise<unknown> {
  return jsf.resolve(cloneDeep(source));
}
