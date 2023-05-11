import faker from '@faker-js/faker';
import { JsonValue, JsonObject } from 'type-fest';
import { cloneDeep } from 'lodash';
import { JSONSchema } from '../../types';
import * as JSONSchemaFaker from 'json-schema-faker';
import * as sampler from '@stoplight/json-schema-sampler';
import { Either, toError, tryCatch } from 'fp-ts/Either';
import { IHttpOperation } from '@stoplight/types';
import { pipe } from 'fp-ts/function';
import * as E from 'fp-ts/lib/Either';
import { stripWriteOnlyProperties } from '../../utils/filterRequiredProperties';

// necessary as workaround broken types in json-schema-faker
// @ts-ignore
JSONSchemaFaker.extend('faker', () => faker);

/**
 * Replaces template values from the root schema.
 */
function template(value: JsonValue, rootSchema: JSONSchema): JsonValue {
  if (Array.isArray(value)) {
    return value.map(x => template(x, rootSchema));
  }

  if (typeof value === 'string') {
    value = value.replace(/#\{([\w.-]+)\}/g, (_, $1) => rootSchema[$1]);
  }
  return value;
}

/**
 * Allows setting minimum array cardinality via an x-min-items property.
 */
function minItemsExtension(
  value: JsonValue,
  schema: JsonObject,
  property: string,
  rootSchema: JSONSchema
): JsonValue {
  value = Number(template(value, rootSchema));
  if (!isNaN(value)) {
    if (
      (!('minItems' in schema) || (typeof schema.minItems === 'number' && schema.minItems <= value)) &&
      (!('maxItems' in schema) || (typeof schema.maxItems === 'number' && schema.maxItems >= value))
    ) {
      schema.minItems = value;
    }
  }
  return schema;
}

// @ts-ignore
JSONSchemaFaker.define('min-items', minItemsExtension);

/**
 * Allows setting maximum array cardinality via an x-max-items property.
 */
function maxItemsExtension(
  value: JsonValue,
  schema: JsonObject,
  property: string,
  rootSchema: JSONSchema
): JsonValue {
  value = Number(template(value, rootSchema));
  if (!isNaN(value)) {
    if (
      (!('minItems' in schema) || (typeof schema.minItems === 'number' && schema.minItems <= value)) &&
      (!('maxItems' in schema) || (typeof schema.maxItems === 'number' && schema.maxItems >= value))
    ) {
      schema.maxItems = value;
    }
  }
  return schema;
}

// @ts-ignore
JSONSchemaFaker.define('max-items', maxItemsExtension);

/**
 * Allows setting array cardinality via an x-count property.
 */
function countExtension(
  value: JsonValue,
  schema: JsonObject,
  property: string,
  rootSchema: JSONSchema
): JsonValue {
  value = template(value, rootSchema);
  if (Array.isArray(value) && value.length >= 2) {
    minItemsExtension(value[0], schema, property, rootSchema);
    maxItemsExtension(value[1], schema, property, rootSchema);
  } else if (!Array.isArray(value)) {
    minItemsExtension(value, schema, property, rootSchema);
    maxItemsExtension(value, schema, property, rootSchema);
  }
  return schema;
}

// @ts-ignore
JSONSchemaFaker.define('count', countExtension);

// From https://github.com/json-schema-faker/json-schema-faker/tree/develop/docs
// Using from entries since the types aren't 100% compatible
const JSON_SCHEMA_FAKER_DEFAULT_OPTIONS = Object.fromEntries([
  ['defaultInvalidTypeProduct', null],
  ['defaultRandExpMax', 10],
  ['pruneProperties', []],
  ['ignoreProperties', []],
  ['ignoreMissingRefs', false],
  ['failOnInvalidTypes', true],
  ['failOnInvalidFormat', true],
  ['alwaysFakeOptionals', false],
  ['optionalsProbability', false],
  ['fixedProbabilities', false],
  ['useExamplesValue', false],
  ['useDefaultValue', false],
  ['requiredOnly', false],
  ['minItems', 0],
  ['maxItems', null],
  ['minLength', 0],
  ['maxLength', null],
  ['refDepthMin', 0],
  ['refDepthMax', 3],
  ['resolveJsonPath', false],
  ['reuseProperties', false],
  ['sortProperties', null],
  ['fillProperties', true],
  ['random', Math.random],
  ['replaceEmptyByRandomValue', false],
  ['omitNulls', false],
]);

export function resetGenerator() {
  // necessary as workaround broken types in json-schema-faker
  // @ts-ignore
  JSONSchemaFaker.option({
    ...JSON_SCHEMA_FAKER_DEFAULT_OPTIONS,
    failOnInvalidTypes: false,
    failOnInvalidFormat: false,
    alwaysFakeOptionals: true,
    optionalsProbability: 1,
    fixedProbabilities: true,
    ignoreMissingRefs: true,
  });
}

resetGenerator();

export function generate(bundle: unknown, source: JSONSchema): Either<Error, unknown> {
  return pipe(
    stripWriteOnlyProperties(source),
    E.fromOption(() => Error('Cannot strip writeOnly properties')),
    E.chain(updatedSource =>
      tryCatch(
        // necessary as workaround broken types in json-schema-faker
        // @ts-ignore
        () => sortSchemaAlphabetically(JSONSchemaFaker.generate({ ...cloneDeep(updatedSource), __bundled__: bundle })),
        toError
      )
    )
  );
}

//sort alphabetically by keys
export function sortSchemaAlphabetically(source: any): any {
  if (source && Array.isArray(source)) {
    for (const i of source) {
      if (typeof source[i] === 'object') {
        source[i] = sortSchemaAlphabetically(source[i]);
      }
    }
    return source;
  } else if (source && typeof source === 'object') {
    Object.keys(source).forEach((key: string) => {
      if (typeof source[key] === 'object') {
        source[key] = sortSchemaAlphabetically(source[key]);
      }
    });
    return Object.fromEntries(Object.entries(source).sort());
  }

  //just return if not array or object
  return source;
}

export function generateStatic(resource: IHttpOperation, source: JSONSchema): Either<Error, unknown> {
  return tryCatch(() => sampler.sample(source, {}, resource), toError);
}
