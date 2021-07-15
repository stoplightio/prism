import { JSONSchema4, JSONSchema6, JSONSchema7 } from 'json-schema';
import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import { Option } from 'fp-ts/Option';
import * as A from 'fp-ts/Array';
import { JSONSchema } from '../types';

type Properties = Record<string, JSONSchema6 | JSONSchema7 | JSONSchema4 | boolean>;

type RequiredSchemaSubset = {
  readOnly?: boolean;
  writeOnly?: boolean;
  properties?: Properties;
  required?: string[] | false;
};

const buildSchemaFilter = <S extends RequiredSchemaSubset>(
  keepPropertyPredicate: (schema: S) => Option<S>
): ((schema: S) => Option<S>) => {
  function filterProperties(schema: S): Option<S> {
    return pipe(
      O.fromNullable(schema.properties),
      O.map(properties =>
        pipe(
          Object.keys(properties),
          A.reduce(
            {} as Properties,
            (filteredProperties: Properties, propertyName): Properties => {
              return pipe(
                properties[propertyName],
                O.fromPredicate(p => {
                  if (typeof p === 'boolean') {
                    filteredProperties[propertyName] = properties[propertyName];
                    return false;
                  }
                  return true;
                }),
                O.chain(p => filter(p as S)),
                O.map(v => ({ ...filteredProperties, [propertyName]: v } as Properties)),
                O.fold(
                  () => filteredProperties,
                  v => v
                )
              );
            }
          )
        )
      ),
      O.map(filteredProperties => ({
        ...schema,
        properties: filteredProperties,
      })),
      O.alt(() => O.some(schema))
    );
  }

  function filterRequired(updatedSchema: S, originalSchema: S): Option<S> {
    return pipe(
      updatedSchema,
      O.fromPredicate((schema: S) => Array.isArray(schema.required)),
      O.map(schema => Object.keys(schema.properties || {})),
      O.map(updatedProperties => {
        const originalPropertyNames = Object.keys(originalSchema.properties || {});
        return originalPropertyNames.filter(name => !updatedProperties.includes(name));
      }),
      O.map(removedProperties =>
        (originalSchema.required as string[]).filter(name => !removedProperties.includes(name))
      ),
      O.map(required => {
        return {
          ...updatedSchema,
          required,
        };
      }),
      O.alt(() => O.some(updatedSchema))
    );
  }

  function filter(inputSchema: S): Option<S> {
    return pipe(
      inputSchema,
      keepPropertyPredicate,
      O.chain(inputSchema => filterProperties(inputSchema)),
      O.chain(schema => filterRequired(schema, inputSchema))
    );
  }

  return filter;
};

export const stripReadOnlyProperties = buildSchemaFilter(
  O.fromPredicate((schema: JSONSchema) => schema.readOnly !== true)
);
export const stripWriteOnlyProperties = buildSchemaFilter(
  O.fromPredicate((schema: JSONSchema) => schema.writeOnly !== true)
);
