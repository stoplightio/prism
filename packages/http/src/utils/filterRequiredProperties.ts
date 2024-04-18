import { JSONSchema4, JSONSchema6, JSONSchema7 } from 'json-schema';
import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import { Option } from 'fp-ts/Option';
import * as A from 'fp-ts/Array';
import { JSONSchema } from '../types';

type JSONSchemaObjectType = JSONSchema6 | JSONSchema7 | JSONSchema4
type Properties = Record<string, JSONSchemaObjectType | boolean>;

/**
 * for items type signature: see https://tools.ietf.org/html/draft-zyp-json-schema-03, 
 * sections 5.5, 6.4, and 6.9
 * for additionalItems type signature, see sections 5.6, 6.4, and 6.10
 */
type RequiredSchemaSubset = {
  readOnly?: boolean;
  writeOnly?: boolean;
  properties?: Properties;
  required?: string[] | false;
  items?: JSONSchemaObjectType | JSONSchemaObjectType[] | boolean;
  additionalItems?: JSONSchemaObjectType | boolean;
};

const buildSchemaFilter = <S extends RequiredSchemaSubset>(
  keepPropertyPredicate: (schema: S) => Option<S>
): ((schema: S) => Option<S>) => {
  // Helper function to filter properties from a *single* object (as opposed to a list of objects)
  function filterPropertiesFromObjectSingle(schema: S): Option<S> {
    return pipe(
      O.fromNullable(schema.items as S),
      O.chain(items => O.fromNullable((items as S).properties as Properties)), // the schema is an array with a single-typed item, i.e. non-tuple typing
      O.alt(() => O.fromNullable(schema.properties)), // the schema is an object that's not an array 
      O.alt(() => pipe ( // the schema is an tuple-typed array with additionalItems schema defined
        O.fromNullable(schema.additionalItems as S),
        O.map(additionalItems => additionalItems.properties as Properties)
      )),
      O.chain((unfilteredProps: Properties) => filterPropertiesHelper(O.fromNullable(unfilteredProps))),
      O.map(filteredProperties => {
        if (schema.items) { // the schema is an array
          if (Array.isArray(schema.items) && typeof schema.additionalItems === 'object') { 
            return { // the array is tuple-typed with additionalItems schema object specified
              ...schema,
              additionalItems: {
                ...schema.additionalItems,
                properties: filteredProperties
              }
            };
          } else if (typeof schema.items === 'object') { 
            return { // the array is non-tuple typed
              ...schema,
              items: {
                ...schema.items,
                properties: filteredProperties,
              },
            };
          }   
        }
        return { // the schema is a non-array object
          ...schema,
          properties: filteredProperties,
        };
      }),
      O.alt(() => O.some(schema))
    );
  }

  // Helper function to filter properties from a list of objects
  function filterPropertiesFromObjectsList(schema: S): Option<S> {
    return pipe(
      O.fromNullable(schema.items as S[]),
      O.chain(items => pipe(
        items,
        A.map(item => (item as S).properties),
        propertiesArray => O.fromNullable(propertiesArray)
      )),
      O.map(unfilteredProps => pipe(
        unfilteredProps,
        A.map(unfilteredProp => filterPropertiesHelper(O.fromNullable(unfilteredProp)))
      )),
      O.map(filteredProperties => {
        const items = pipe(
          A.zip(schema.items as S[], filteredProperties),
          A.map(([item, properties]) => ({
            ...item,
            properties: pipe(
              properties,
              O.getOrElse(() => ({} as object))
            )
          }))
        );
        return {
          ...schema,
          items: [
            ...items
          ]
        };
      }),
      O.alt(() => O.some(schema))
    );
  }

  function filterPropertiesHelper(properties: Option<Properties>): Option<Properties> {
    return pipe(
      properties,
      O.map(properties =>
        pipe(
          Object.keys(properties),
          A.reduce(
            {} as Properties,
            (filteredProperties: Properties, propertyName): Properties => pipe(
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
            )
          )
        )
      )
    )
  }

  // Helper function to filter required properties from a *single* object (as opposed to a list of objects)
  function filterRequiredFromObjectSingle(updatedSchema: S, originalSchema: S): Option<S> {
    function getCorrectSchema(schema: S) {
      if (Array.isArray(schema.items) && typeof schema.additionalItems === 'object') { 
        return schema.additionalItems as S; // we're looking at the additionItems schema object in a tuple-typed array schema
      } else if (typeof schema.items === 'object') { 
        return (schema.items as S); // we're looking at the single item schema object in a non-tuple-typed array schema
      } 
      return schema; // schema is not an array
    }

    return pipe(
      updatedSchema,
      schema => filterRequiredHelper(getCorrectSchema(schema), getCorrectSchema(originalSchema)),
      O.map(required => {
        if (Array.isArray(updatedSchema.items) && typeof updatedSchema.additionalItems === 'object') {
          return {
            ...updatedSchema,
            additionalItems: {
              ...updatedSchema.additionalItems,
              required: required
            }
          };
        } else if (updatedSchema.items && typeof updatedSchema.items === 'object') {
          return {
            ...updatedSchema,
            items: {
              ...updatedSchema.items,
              required: required,
            },
          };
        }
        return {
          ...updatedSchema,
          required: required,
        }
      }),
      O.alt(() => O.some(updatedSchema))
    );
  }

  // Helper function to filter required properties from a list of objects
  function filterRequiredFromObjectsList(updatedSchema: S, originalSchema: S): Option<S> {
    return pipe(
      O.fromNullable(updatedSchema.items as S[]),
      O.chain(itemSchemas => pipe(
        O.fromNullable(originalSchema.items as S[]),
        O.map(originalItemSchemas => A.zip(itemSchemas, originalItemSchemas)),
        O.map(zippedSchemas => 
          zippedSchemas.map(([itemSchema, originalItemSchema]) => filterRequiredHelper(itemSchema, originalItemSchema))
        )
      )),
      O.map(requiredList => {
        const items = pipe(
          A.zip(updatedSchema.items as S[], requiredList),
          A.map(([item, required]) => {
            return {
              ...item,
              required: pipe(
                required,
                O.getOrElse(() => [] as string[])
              )
            };
          })
        );
        return {
          ...updatedSchema,
          items: [
            ...items
          ]
        };
      }),
      O.alt(() => O.some(updatedSchema))
    );
  }

  function filterRequiredHelper(updatedSchema: S, originalSchema: S): Option<string []> {
    return pipe (
      updatedSchema,
      O.fromPredicate(schema => Array.isArray(schema.required)),
      O.map(schema => Object.keys(schema.properties || {})),
      O.map(updatedProperties => {
        const originalPropertyNames = Object.keys(originalSchema.properties || {});
        return originalPropertyNames.filter(name => !updatedProperties.includes(name));
      }),
      O.map(removedProperties => {
        const required = originalSchema.required;
        return (required as string[]).filter(name => !removedProperties.includes(name));
      })
    );
  }

  // Handles both non-array schemas and array schemas (both single-typed and tuple typed, with and without additionalItems)
  // See: https://json-schema.org/understanding-json-schema/reference/array
  function filter(inputSchema: S): Option<S> {
    return pipe(
      inputSchema,
      keepPropertyPredicate,
      O.chain(inputSchema => pipe(
        O.fromNullable(inputSchema),
        O.chain(schema => 
          Array.isArray(schema.items) ? // Schema is tuple-typed array
            pipe(
              filterPropertiesFromObjectsList(schema), // Filter properties from the tuple-typed list of item schema objects
              O.chain(filteredSchema => filterPropertiesFromObjectSingle(filteredSchema)) // Try to filter properties from additionalItems, if it exists
            )
          : filterPropertiesFromObjectSingle(schema) // Schema is non-tuple-typed array, or a non-array schema. Either way we're filtering properties from a single object.
        )
      )),
      O.chain(schema => pipe(
        O.fromNullable(schema),
        O.chain(schema => 
          Array.isArray(schema.items) ? // Schema is tuple-typed array
            pipe(
              filterRequiredFromObjectsList(schema, inputSchema), // Filter required from the tuple-typed list of item schema objects
              O.chain(filteredSchema => filterRequiredFromObjectSingle(filteredSchema, inputSchema)) // Try to filter required from additionalItems, if it exists
            )
          : filterRequiredFromObjectSingle(schema, inputSchema)  // Schema is non-tuple-typed array, or a non-array schema. Either way we're filtering required from a single object.
        )
      ))
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
