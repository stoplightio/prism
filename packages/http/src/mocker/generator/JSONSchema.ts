import { JSONSchema } from 'http/src/types';
import { JSONSchema6, JSONSchema7 } from 'json-schema';
import { cloneDeep, map, mapValues } from 'lodash';

// @ts-ignore
import * as jsf from '@stoplight/json-schema-faker';
// @ts-ignore
import * as sampler from 'openapi-sampler';

jsf.option({
  failOnInvalidTypes: false,
  failOnInvalidFormat: false,
  alwaysFakeOptionals: true,
  optionalsProbability: 1,
  fixedProbabilities: true,
  ignoreMissingRefs: true,
  maxItems: 20,
  maxLength: 100,
});

export function generate(source: JSONSchema): unknown {
  return jsf.generate(cloneDeep(source));
}

export function generateStatic(source: JSONSchema): unknown {
  const transformedSchema = toOpenAPIJSONSchemaesque(source);
  return sampler.sample(transformedSchema);
}

function hasExamples(source: JSONSchema): source is JSONSchema6 | JSONSchema7 {
  return 'examples' in source;
}

function toOpenAPIJSONSchemaesque(schema: JSONSchema): any {
  const returnedSchema = cloneDeep(schema);

  ['properties', 'anyOf', 'allOf', 'oneOf'].forEach(property => {
    if (!returnedSchema[property]) return;

    const mapFn = Array.isArray(returnedSchema[property]) ? map : (mapValues as (obj: unknown) => unknown[] | unknown);

    returnedSchema[property] = mapFn(schema[property], innerProp => {
      if (typeof innerProp === 'boolean') return innerProp;

      if (hasExamples(innerProp) && Array.isArray(innerProp.examples)) {
        Object.assign(innerProp, { example: innerProp.examples[0] });
      }

      return toOpenAPIJSONSchemaesque(innerProp);
    });
  });

  return returnedSchema;
}
