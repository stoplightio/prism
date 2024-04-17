import { JSONSchema4, JSONSchema6, JSONSchema7 } from 'json-schema';
import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import { Option } from 'fp-ts/Option';
import * as A from 'fp-ts/Array';
import { JSONSchema } from '../types';

type JSONSchemaObjectType = JSONSchema6 | JSONSchema7 | JSONSchema4
type JSONSchemaArrType = JSONSchema4[] | JSONSchema6[] | JSONSchema7[]

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
  function filterNonTupleTypedProperties(schema: S): Option<S> {
    console.log("SCHEMA ITEMS", schema.items)
    return pipe(
      O.fromNullable(schema.items),
      O.chain(items => {
        if (typeof items === 'object') {
          console.log("ARRAY FOUND PROPS")
          return pipe(
            O.fromNullable((items as JSONSchemaObjectType).properties),
            O.chainNullableK(properties => properties as Properties)
          )
        } 
        return O.none
      }),
      O.alt(() => {
        console.log("NORMAL NON ARRAY PROPS")
        return O.fromNullable(schema.properties)}),
      O.chain(unfilteredProps => filterPropertiesHelper(O.fromNullable(unfilteredProps as Properties))),
      O.map(filteredProperties => {
        console.log("FILTERED PROPS", filteredProperties, "SCHEMA", schema)
        if (schema.items && typeof schema.items === 'object') {
          return {
            ...schema,
            items: {
              ...schema.items,
              properties: filteredProperties,
            },
          };
        } 
        return {
          ...schema,
          properties: filteredProperties,
        }
      }
      ),
      O.alt(() => {
        console.log("RESULT SCHEMA", schema)
        return O.some(schema)
      })
    );
  }

  function filterTupleTypedProperties(schema: S): Option<S> {
    console.log("SCHEMA ITEMS", schema.items)
    return pipe(
      O.fromNullable(schema.items as Properties[]),
      O.chain(items => {
        return pipe(
            items,
            A.map(item => (item as JSONSchemaObjectType).properties),
            propertiesArray => O.fromNullable(propertiesArray as Properties[]) // Casting because Properties is likely expected to be an object, not an array
          )
        }
      ),
      O.map(unfilteredProps => {
        return pipe(
              unfilteredProps,
              A.map(unfilteredProp => filterPropertiesHelper(O.fromNullable(unfilteredProp as Properties))),
            )
        }
      ),
      O.chain(filteredProperties => {
        console.log("FILTERED PROPS", filteredProperties, "SCHEMA", schema)
        if (schema.items && typeof schema.items === 'object') {
          const items = (schema.items as JSONSchemaArrType).map((item, index) => {
            const defaultProperty = {};
            const properties = 
              pipe(
                    filteredProperties[index],
                   O.getOrElse(() => defaultProperty)
                 );
            return { ...item, properties };
          });

          return O.some({
            ...schema,
            items: {
              ...items
            },
          });
        } 
        return O.none
      }
      ),
      O.alt(() => {
        console.log("RESULT SCHEMA", schema)
        return O.some(schema)
      })
    );
  }

  function filterRequired(updatedSchema: S, originalSchema: S): Option<S> {
    return pipe(
      updatedSchema,
      O.fromPredicate((schema: S) => {
        let required;
        if (schema.items && typeof schema.items === 'object') {
          required = (schema.items as JSONSchemaObjectType).required;
        } else {
          required = schema.required;
        }
        return Array.isArray(required)
      }),
      O.map(schema => 
        { 
          let properties;
          if (schema.items && typeof schema.items === 'object') {
            properties = (schema.items as JSONSchemaObjectType).properties;
          } else {
            properties = schema.properties;
          }
          return Object.keys(properties || {})
      }
      ),
      O.map(updatedProperties => {
        let properties;
          if (originalSchema.items && typeof originalSchema.items === 'object') {
            properties = (originalSchema.items as JSONSchemaObjectType).properties;
          } else {
            properties = originalSchema.properties;
          }

        const originalPropertyNames = Object.keys(properties || {});
        return originalPropertyNames.filter(name => !updatedProperties.includes(name));
      }),
      O.map(removedProperties =>
        {
          let required;
          if (originalSchema.items && typeof originalSchema.items === 'object') {
            required = (originalSchema.items as JSONSchemaObjectType).required;
          } else {
            required = originalSchema.required;
          }
        return (required as string[]).filter(name => !removedProperties.includes(name))
        }
      ),
      O.map(required => {
        console.log("UPDATED SCHEMA", updatedSchema, "REQUIRED", required)
        if (updatedSchema.items && typeof updatedSchema.items === 'object') {
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
                  console.log("properties", properties)
                  console.log("propertyName", propertyName)
                  if (typeof p === 'boolean') { // I think this is bc Object.keys only handles string props so boolean props need to be added back in manually
                    filteredProperties[propertyName] = properties[propertyName];
                    return false;
                  }
                  console.log("P", p)
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

  function filter(inputSchema: S): Option<S> {
    return pipe(
      inputSchema,
      keepPropertyPredicate,
      O.chain(inputSchema => {
        console.log("INPUT SCHEMA", inputSchema)
        if (inputSchema.items && Array.isArray(inputSchema.items)) { // Tuple typing
          return filterTupleTypedProperties(inputSchema)
        }
        return filterNonTupleTypedProperties(inputSchema)
      } ),
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
