import { JSONSchema4, JSONSchema6, JSONSchema7 } from 'json-schema';
import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import { Option } from 'fp-ts/Option';
import * as A from 'fp-ts/Array';
import { JSONSchema } from '../types';
import { update } from 'lodash';

type JSONSchemaObjectType = JSONSchema6 | JSONSchema7 | JSONSchema4
type JSONSchemaArrType = JSONSchemaObjectType[]

type Properties = Record<string, JSONSchemaObjectType | boolean>;
type ArrayItems = JSONSchemaObjectType | JSONSchemaArrType | boolean;
type ArrayAdditionalItems = JSONSchemaObjectType | boolean;

type RequiredSchemaSubset = {
  readOnly?: boolean;
  writeOnly?: boolean;
  properties?: Properties;
  required?: string[] | false;
  items?: ArrayItems;
  additionalItems?: ArrayAdditionalItems;
};

const buildSchemaFilter = <S extends RequiredSchemaSubset>(
  keepPropertyPredicate: (schema: S) => Option<S>
): ((schema: S) => Option<S>) => {
  function filterPropertiesFromObjectSingle(schema: S): Option<S> {
    // console.log("SCHEMA ITEMS", schema.items, "SCHEMA", schema)
    return pipe(
      O.fromNullable(schema.items),
      O.chain(items => {
        // the schema is an array with a single-schema item, i.e. non-tuple typing
        return O.fromNullable((items as JSONSchemaObjectType).properties as Properties) 
      }),
      O.alt(() => O.fromNullable(schema.properties)),  // the schema is an object that's not an array 
      O.alt(() => { 
        // the schema is an tuple-typed array with additionalItems defined
        return pipe (
          O.fromNullable(schema.additionalItems as JSONSchemaObjectType),
          O.map(additionalItems => additionalItems.properties as Properties)
        )
      }),
      O.chain((unfilteredProps: Properties) => filterPropertiesHelper(O.fromNullable(unfilteredProps))),
      O.map(filteredProperties => {
        // console.log("FILTERED PROPS", filteredProperties, "SCHEMA", schema, "ITEMS", schema.items)
        if (schema.items) { // the schema is an array
          // console.log("I HAVE FOUND SCHEMA ITEMS", schema.items, typeof schema.items === 'object', Array.isArray(schema.items), "ADDITIONAL", schema.additionalItems, typeof schema.additionalItems === 'object')
          // console.log("I AM HERE")
          if (Array.isArray(schema.items) && typeof schema.additionalItems === 'object') { // tuple typed array with additionalItems specified
            // console.log("FOUND ADDITIONAL ITEMS, RESULTING SCHEMA", schema, "ADDITIONAL ITEMS ORIGINAL", schema.additionalItems)
            return {
              ...schema,
              additionalItems: {
                ...schema.additionalItems,
                properties: filteredProperties
              }
            };
          } else if (typeof schema.items === 'object') { // the array is non-tuple typed
              // console.log("ARRAY IS OBJECT")
              return {
                ...schema,
                items: {
                  ...schema.items,
                  properties: filteredProperties,
                },
              };
            } 
            
            
      }
        return { // the schema is an object
          ...schema,
          properties: filteredProperties,
        }
      }
      ),
      O.alt(() => {
        // console.log("RESULT SCHEMA", schema)
        return O.some(schema)
      })
    );
  }

  function filterPropertiesFromObjectsList(schema: S): Option<S> {
    // console.log("SCHEMA ITEMS", schema.items)
    return pipe(
      O.fromNullable(schema.items as JSONSchemaArrType),
      O.chain(items => {
        return pipe(
          items,
          A.map(item => (item as JSONSchemaObjectType).properties),
          propertiesArray => O.fromNullable(propertiesArray as Properties[]) // Casting because Properties is likely expected to be an object, not an array
        )
      }),
      O.map(unfilteredProps => {
        return pipe(
          unfilteredProps,
          A.map(unfilteredProp => filterPropertiesHelper(O.fromNullable(unfilteredProp as Properties))),
        )
      }),
      O.map(filteredProperties => {
        const items = pipe(
          A.zip(schema.items as JSONSchemaArrType, filteredProperties),
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
          ],
        };
      }),
      O.alt(() => {
        // console.log("RESULT SCHEMA", schema)
        return O.some(schema)
      })
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
            (filteredProperties: Properties, propertyName): Properties => {
              return pipe(
                properties[propertyName],
                O.fromPredicate(p => {
                  // console.log("properties", properties)
                  // console.log("propertyName", propertyName)
                  if (typeof p === 'boolean') { // I think this is bc Object.keys only handles string props so boolean props need to be added back in manually
                    filteredProperties[propertyName] = properties[propertyName];
                    return false;
                  }
                  // console.log("P", p)
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
      )
    )
  }

  function filterRequiredHelper(updatedSchema: S | JSONSchemaObjectType, originalSchema: S | JSONSchemaObjectType): Option<string []> {
    const x = pipe (
      updatedSchema,
      O.fromPredicate(schema => Array.isArray(schema.required)),
      O.map(schema => Object.keys(schema.properties || {})),
      O.map(updatedProperties => {
        const originalPropertyNames = Object.keys(originalSchema.properties || {});
        return originalPropertyNames.filter(name => !updatedProperties.includes(name));
      }),
      O.map(removedProperties => {
        const required = originalSchema.required
        // console.log("HEHEHRERER", required, "REMOVED PROPS", removedProperties)
        // console.log("RES", (required as string[]).filter(name => !removedProperties.includes(name)))
        return (required as string[]).filter(name => !removedProperties.includes(name))
      }),
    )
    console.log("INTERMEDIATE", x)
    return x
  }

  function filterRequiredFromObjectSingle(updatedSchema: S, originalSchema: S): Option<S> {
    function getCorrectSchema(schema: S) {
      if (Array.isArray(schema.items) && typeof schema.additionalItems === 'object') { 
        return schema.additionalItems; // we're looking at the additionItems object in a schema with a tuple-typed array
      } else if (typeof schema.items === 'object') { 
        return (schema.items as JSONSchemaObjectType); // we're looking at the item schema for a non-tuple-typed array
      } 
      return schema; // schema is not an array
    }

    return pipe(
      updatedSchema,
      schema => {
        console.log("HERE1")
        const x = filterRequiredHelper(getCorrectSchema(schema), getCorrectSchema(originalSchema))
        console.log("HERE2", x)
        return x
      },
      O.map(required => {
        // console.log("UPDATED SCHEMA", updatedSchema, "REQUIRED", required)
        // console.log("Array.isArray(updatedSchema.items)", updatedSchema.items, Array.isArray(updatedSchema.items), updatedSchema.additionalItems, typeof updatedSchema.additionalItems === 'object')
        if (Array.isArray(updatedSchema.items) && typeof updatedSchema.additionalItems === 'object') {
          return {
            ...updatedSchema,
            additionalItems: {
              ...updatedSchema.additionalItems,
              required: required
            }
          };
        }
        else if (updatedSchema.items && typeof updatedSchema.items === 'object') {
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

  function filterRequiredFromObjectsList(updatedSchema: S, originalSchema: S): Option<S> {
    return pipe(
      O.fromNullable(updatedSchema.items as JSONSchemaArrType),
      O.chain(itemSchemas => {
        return pipe(
          O.fromNullable(originalSchema.items as JSONSchemaArrType),
          O.map(originalItemSchemas => {
            // console.log("ITEM SCHEMAS", itemSchemas, "ORIGINAL ITEM SCHEMAS", originalSchema.items)
            return A.zip(itemSchemas, originalItemSchemas)}),
          O.map(zippedSchemas => {
            // console.log("HERE", zippedSchemas)
            return zippedSchemas.map(([itemSchema, originalItemSchema]) => filterRequiredHelper(itemSchema, originalItemSchema))
          }
          )
        )
      }),
      O.map(requiredList => {
        // console.log("REQUIRED LIST", requiredList)
        const items = pipe(
          A.zip(updatedSchema.items as JSONSchemaArrType, requiredList),
          A.map(([item, required]) => {
            // console.log("ITEM", item, "REQUIRED", required)
          return {
            ...item,
            required: pipe(
              required,
              O.getOrElse(() => [] as string[])
            )
          }
        }
          )
        );

        return {
          ...updatedSchema,
          items: [
            ...items
          ],
        }
      }),
      O.alt(() => O.some(updatedSchema))
    );
  }

  function filter(inputSchema: S): Option<S> {
    return pipe(
      inputSchema,
      keepPropertyPredicate,
      O.chain(inputSchema => {

        return pipe(
          O.fromNullable(inputSchema),
          O.chain(schema => 
            Array.isArray(schema.items) ?
              pipe(
                filterPropertiesFromObjectsList(schema),
                O.alt(() => O.some(schema)), 
                O.chain(filteredSchema => { 
                  // console.log("HEREEEE", filteredSchema, filteredSchema.items)
                  return filterPropertiesFromObjectSingle(filteredSchema)
                })
              ) :
              filterPropertiesFromObjectSingle(schema)
          )
        );
      } ),
      O.chain(schema => {
        return pipe(
          O.fromNullable(schema),
          O.chain(schema => 
            Array.isArray(schema.items) ?
              pipe(
                filterRequiredFromObjectsList(schema, inputSchema),
                O.alt(() => O.some(schema)), 
                O.chain(filteredSchema => { 
                  // console.log("HEREEEE", filteredSchema, filteredSchema.items)
                  return filterRequiredFromObjectSingle(filteredSchema, inputSchema)
                })
              ) :
              filterRequiredFromObjectSingle(schema, inputSchema)
          )
        );
        // if (inputSchema.items && Array.isArray(inputSchema.items)) { // Tuple typing
        //   return filterRequiredFromObjectsList(schema, inputSchema)
        // }
        // return filterRequiredFromObjectSingle(schema, inputSchema)
      })
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
