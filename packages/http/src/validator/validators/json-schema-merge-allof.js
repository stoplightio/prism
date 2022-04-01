'use strict'
var compact = require('lodash/compact')
var compare = require('json-schema-compare')
var computeLcm = require('compute-lcm')
var defaultsDeep = require('lodash/defaultsDeep')
var flatten = require('lodash/flatten')
var flattenDeep = require('lodash/flattenDeep')
var intersection = require('lodash/intersection')
var intersectionWith = require('lodash/intersectionWith')
var isEqual = require('lodash/isEqual')
var isPlainObject = require('lodash/isPlainObject')
var pullAll = require('lodash/pullAll')
var pick = require('lodash/pick')
var sortBy = require('lodash/sortBy')
var forEach = require('lodash/forEach')
var uniq = require('lodash/uniq')
var uniqWith = require('lodash/uniqWith')
var without = require('lodash/without')

var withoutArr = (arr, ...rest) => without.apply(null, [arr].concat(flatten(rest)))
var isPropertyRelated = (key) => contains(propertyRelated, key)
var isItemsRelated = (key) => contains(itemsRelated, key)
var contains = (arr, val) => arr.indexOf(val) !== -1
var isEmptySchema = (obj) => (!keys(obj).length) && obj !== false && obj !== true
var isSchema = (val) => isPlainObject(val) || val === true || val === false
var isFalse = (val) => val === false
var isTrue = (val) => val === true
var isNotNull = (val) => val !== null
var schemaResolver = (compacted, key, mergeSchemas) => mergeSchemas(compacted)
var stringArray = (values) => sortBy(uniq(flattenDeep(values)))
var notUndefined = (val) => val !== undefined
var allUniqueKeys = (arr) => uniq(flattenDeep(arr.map(keys)))
var hasInThis = function (annotation) {
  return annotation in this
}

// resolvers
var first = compacted => compacted[0]
var last = compacted => compacted[compacted.length - 1]
var required = compacted => stringArray(compacted)
var maximumValue = compacted => Math.max.apply(Math, compacted)
var minimumValue = compacted => Math.min.apply(Math, compacted)
var uniqueItems = compacted => compacted.some(isTrue)
var examples = compacted => uniqWith(flatten(compacted), isEqual)

function compareProp(key) {
  return function(a, b) {
    return compare({
      [key]: a
    }, {[key]: b})
  }
}

function getAllOf(schema) {
  let { allOf, ...copy } = schema
  copy = isPlainObject(schema) ? copy : schema // if schema is boolean
  if (Array.isArray(allOf)) {
    if (annotationProps.some(hasInThis, copy)) {
      return [copy, ...allOf.filter(isNotNull).map(getAllOf), pick(copy, annotationProps)]
    }

    return [copy, ...allOf.filter(isNotNull).map(getAllOf)]
  }

  return [copy]
}

function getValues(schemas, key) {
  return schemas.map(schema => schema && schema[key])
}

function getItemSchemas(subSchemas, key) {
  return subSchemas.map(function(sub) {
    if (!sub) {
      return
    }

    if (Array.isArray(sub.items)) {
      var schemaAtPos = sub.items[key]
      if (isSchema(schemaAtPos)) {
        return schemaAtPos
      } else if (sub.hasOwnProperty('additionalItems')) {
        return sub.additionalItems
      }
    } else {
      return sub.items
    }
  })
}

function tryMergeSchemaGroups(schemaGroups, mergeSchemas) {
  return schemaGroups.map(function(schemas, index) {
    try {
      return mergeSchemas(schemas, index)
    } catch (e) {
      return undefined
    }
  }).filter(notUndefined)
}

function getAdditionalSchemas(subSchemas) {
  return subSchemas.map(function(sub) {
    if (!sub) {
      return
    }
    if (Array.isArray(sub.items)) {
      return sub.additionalItems
    }
    return sub.items
  })
}

function keys(obj) {
  if (isPlainObject(obj) || Array.isArray(obj)) {
    return Object.keys(obj)
  } else {
    return []
  }
}

function getAnyOfCombinations(arrOfArrays, combinations) {
  combinations = combinations || []
  if (!arrOfArrays.length) {
    return combinations
  }

  var values = arrOfArrays.slice(0).shift()
  var rest = arrOfArrays.slice(1)
  if (combinations.length) {
    return getAnyOfCombinations(rest, flatten(combinations.map(combination => values.map(item => ([item].concat(combination))))))
  }
  return getAnyOfCombinations(rest, values.map(item => (item)))
}

function mergeWithArray(base, newItems) {
  if (Array.isArray(base)) {
    base.splice.apply(base, [0, 0].concat(newItems))
    return base
  } else {
    return newItems
  }
}

function throwIncompatible(values, paths) {
  var asJSON
  try {
    asJSON = values.map(function(val) {
      return JSON.stringify(val, null, 2)
    }).join('\n')
  } catch (variable) {
    asJSON = values.join(', ')
  }
  throw new Error('Could not resolve values for path:"' + paths.join('.') + '". They are probably incompatible. Values: \n' + asJSON)
}

function cleanupReturnValue(returnObject) {
  // cleanup empty
  for (var prop in returnObject) {
    if (returnObject.hasOwnProperty(prop) && isEmptySchema(returnObject[prop])) {
      delete returnObject[prop]
    }
  }
  return returnObject
}

function createRequiredSubMerger(mergeSchemas, key, parents) {
  return function(schemas, subKey) {
    if (subKey === undefined) {
      throw new Error('You need to call merger with a key for the property name or index if array.')
    }
    subKey = String(subKey)
    return mergeSchemas(schemas, null, parents.concat(key, subKey))
  }
}

function callGroupResolver(keys, resolverName, schemas, mergeSchemas, options, parents) {
  if (keys.length) {
    var resolver = options.resolvers[resolverName]
    if (!resolver) {
      throw new Error('No resolver found for ' + resolverName)
    }

    var compacted = uniqWith(schemas.map(function(schema) {
      return keys.reduce(function(all, key) {
        if (schema[key] !== undefined) {
          all[key] = schema[key]
        }
        return all
      }, {})
    }).filter(notUndefined), compare)

    var related = resolverName === 'properties'
      ? propertyRelated
      : itemsRelated

    var mergers = related.reduce(function(all, key) {
      if (contains(schemaGroupProps, key)) {
        all[key] = createRequiredSubMerger(mergeSchemas, key, parents)
      } else {
        all[key] = function(schemas) {
          return mergeSchemas(schemas, null, parents.concat(key))
        }
      }
      return all
    }, {})

    if (resolverName === 'items') {
      mergers.itemsArray = createRequiredSubMerger(mergeSchemas, 'items', parents)
      mergers.items = function(schemas) {
        return mergeSchemas(schemas, null, parents.concat('items'))
      }
    }

    var result = resolver(compacted, parents.concat(resolverName), mergers, options)

    if (!isPlainObject(result)) {
      throwIncompatible(compacted, parents.concat(resolverName))
    }

    return cleanupReturnValue(result)
  }
}

// Provide source when array
function mergeSchemaGroup(group, mergeSchemas, source) {
  var allKeys = allUniqueKeys(source || group)
  var extractor = source
    ? getItemSchemas
    : getValues
  return allKeys.reduce(function(all, key) {
    var schemas = extractor(group, key)
    var compacted = uniqWith(schemas.filter(notUndefined), compare)
    all[key] = mergeSchemas(compacted, key)
    return all
  }, source
    ? []
    : {})
}

function removeFalseSchemas(target) {
  forEach(target, function(schema, prop) {
    if (schema === false) {
      delete target[prop]
    }
  })
}

function removeFalseSchemasFromArray(target) {
  forEach(target, function(schema, index) {
    if (schema === false) {
      target.splice(index, 1)
    }
  })
}

function createRequiredMetaArray(arr) {
  return {required: arr}
}

function default$RefResolver(reference) {
  return {$ref: reference}
}

function inferType(schema) {
  if (!isPlainObject(schema)) return
  if ('type' in schema) return typeof schema.type === 'string' ? schema.type : undefined

  var types = Object.keys(implicitTypes).filter(type => implicitTypes[type].some(prop => prop in schema))
  if (types.length > 0) return types
}

var propertyRelated = ['properties', 'patternProperties', 'additionalProperties']
var itemsRelated = ['items', 'additionalItems']
var schemaGroupProps = ['properties', 'patternProperties', 'definitions', 'dependencies']
var schemaArrays = ['anyOf', 'oneOf']
var schemaProps = [
  'additionalProperties',
  'additionalItems',
  'contains',
  'propertyNames',
  'not',
  'items'
]
var annotationProps = ['title', 'description']

var implicitTypes = {
  object: [...propertyRelated, 'required'],
  array: [...itemsRelated, 'contains', 'uniqueItems', 'minContains', 'maxContains'],
  number: ['multipleOf', 'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum'],
  get integer() { return this.number },
  string: ['pattern', 'minLength', 'maxLength']
}

var defaultResolvers = {
  type(compacted) {
    if (compacted.some(Array.isArray)) {
      var normalized = compacted.map(function(val) {
        return Array.isArray(val)
          ? val
          : [val]
      })
      var common = intersection.apply(null, normalized)

      if (common.length === 1) {
        return common[0]
      } else if (common.length > 1) {
        return uniq(common)
      }
    }
  },
  properties(values, key, mergers, options) {
    // first get rid of all non permitted properties
    if (!options.ignoreAdditionalProperties) {
      values.forEach(function(subSchema) {
        var otherSubSchemas = values.filter(s => s !== subSchema)
        var ownKeys = keys(subSchema.properties)
        var ownPatternKeys = keys(subSchema.patternProperties)
        var ownPatterns = ownPatternKeys.map(k => new RegExp(k))
        otherSubSchemas.forEach(function(other) {
          var allOtherKeys = keys(other.properties)
          var keysMatchingPattern = allOtherKeys.filter(k => ownPatterns.some(pk => pk.test(k)))
          var additionalKeys = withoutArr(allOtherKeys, ownKeys, keysMatchingPattern)
          other.properties = Object.assign({}, other.properties)
          additionalKeys.forEach(function(key) {
            other.properties[key] = mergers.properties([
              other.properties[key], subSchema.additionalProperties
            ], key)
          })
        })
      })

      // remove disallowed patternProperties
      values.forEach(function(subSchema) {
        var otherSubSchemas = values.filter(s => s !== subSchema)
        var ownPatternKeys = keys(subSchema.patternProperties)
        if (subSchema.additionalProperties === false) {
          otherSubSchemas.forEach(function(other) {
            other.patternProperties = Object.assign({}, other.patternProperties)
            var allOtherPatterns = keys(other.patternProperties)
            var additionalPatternKeys = withoutArr(allOtherPatterns, ownPatternKeys)
            additionalPatternKeys.forEach(key => delete other.patternProperties[key])
          })
        }
      })
    }

    var returnObject = {
      additionalProperties: mergers.additionalProperties(values.map(s => s.additionalProperties)),
      patternProperties: mergeSchemaGroup(values.map(s => s.patternProperties), mergers.patternProperties),
      properties: mergeSchemaGroup(values.map(s => s.properties), mergers.properties)
    }

    if (returnObject.additionalProperties === false) {
      removeFalseSchemas(returnObject.properties)
    }

    return returnObject
  },
  dependencies(compacted, paths, mergeSchemas) {
    var allChildren = allUniqueKeys(compacted)

    return allChildren.reduce(function(all, childKey) {
      var childSchemas = getValues(compacted, childKey)
      var innerCompacted = uniqWith(childSchemas.filter(notUndefined), isEqual)

      // to support dependencies
      var innerArrays = innerCompacted.filter(Array.isArray)

      if (innerArrays.length) {
        if (innerArrays.length === innerCompacted.length) {
          all[childKey] = stringArray(innerCompacted)
        } else {
          var innerSchemas = innerCompacted.filter(isSchema)
          var arrayMetaScheams = innerArrays.map(createRequiredMetaArray)
          all[childKey] = mergeSchemas(innerSchemas.concat(arrayMetaScheams), childKey)
        }
        return all
      }

      innerCompacted = uniqWith(innerCompacted, compare)

      all[childKey] = mergeSchemas(innerCompacted, childKey)
      return all
    }, {})
  },
  items(values, paths, mergers) {
    var items = values.map(s => s.items)
    var itemsCompacted = items.filter(notUndefined)
    var returnObject = {}

    if (itemsCompacted.every(isSchema)) {
      returnObject.items = mergers.items(items)
    } else {
      returnObject.items = mergeSchemaGroup(values, mergers.itemsArray, items)
    }

    var schemasAtLastPos
    if (itemsCompacted.every(Array.isArray)) {
      schemasAtLastPos = values.map(s => s.additionalItems)
    } else if (itemsCompacted.some(Array.isArray)) {
      schemasAtLastPos = getAdditionalSchemas(values)
    }

    if (schemasAtLastPos) {
      returnObject.additionalItems = mergers.additionalItems(schemasAtLastPos)
    }

    if (returnObject.additionalItems === false && Array.isArray(returnObject.items)) {
      removeFalseSchemasFromArray(returnObject.items)
    }

    return returnObject
  },
  oneOf(compacted, paths, mergeSchemas) {
    var combinations = getAnyOfCombinations(compacted)
    var result = tryMergeSchemaGroups(combinations, mergeSchemas)
    var unique = uniqWith(result, compare)

    if (unique.length) {
      return unique
    }
  },
  not(compacted) {
    return {anyOf: compacted}
  },
  pattern(compacted) {
    return compacted.map(r => '(?=' + r + ')').join('')
  },
  multipleOf(compacted) {
    var integers = compacted.slice(0)
    var factor = 1
    while (integers.some(n => !Number.isInteger(n))) {
      integers = integers.map(n => n * 10)
      factor = factor * 10
    }
    return computeLcm(integers) / factor
  },
  enum(compacted) {
    var enums = intersectionWith.apply(null, compacted.concat(isEqual))
    if (enums.length) {
      return sortBy(enums)
    }
  }
}

defaultResolvers.$id = first
defaultResolvers.$ref = first
defaultResolvers.$schema = first
defaultResolvers.additionalItems = schemaResolver
defaultResolvers.additionalProperties = schemaResolver
defaultResolvers.anyOf = defaultResolvers.oneOf
defaultResolvers.contains = schemaResolver
defaultResolvers.default = last
defaultResolvers.definitions = defaultResolvers.dependencies
defaultResolvers.description = last
defaultResolvers.examples = examples
defaultResolvers.exclusiveMaximum = minimumValue
defaultResolvers.exclusiveMinimum = maximumValue
defaultResolvers.maximum = minimumValue
defaultResolvers.maxItems = minimumValue
defaultResolvers.maxLength = minimumValue
defaultResolvers.maxProperties = minimumValue
defaultResolvers.minimum = maximumValue
defaultResolvers.minItems = maximumValue
defaultResolvers.minLength = maximumValue
defaultResolvers.minProperties = maximumValue
defaultResolvers.propertyNames = schemaResolver
defaultResolvers.required = required
defaultResolvers.title = last
defaultResolvers.uniqueItems = uniqueItems

function merger(rootSchema, options, totalSchemas) {
  totalSchemas = totalSchemas || []
  options = defaultsDeep(options, {
    ignoreAdditionalProperties: false,
    resolvers: defaultResolvers,
    deep: true,
    $refResolver: default$RefResolver
  })

  function mergeSchemas(schemas, base, parents) {
    schemas = schemas.filter(notUndefined)
    parents = parents || []
    var merged = isPlainObject(base)
      ? Object.assign({}, base)
      : {}

    // return undefined, an empty schema
    if (!schemas.length) {
      return
    }

    if (schemas.some(isFalse)) {
      return false
    }

    if (schemas.every(isTrue)) {
      return true
    }

    // there are no false and we don't need the true ones as they accept everything
    schemas = schemas.filter(isPlainObject)

    schemas = schemas.map(schema => '$ref' in schema ? options.$refResolver(schema.$ref) : Object.assign({}, schema))

    var types = schemas.map(schema => inferType(schema)).filter(notUndefined)

    if (types.length > 1) {
      let first = Array.isArray(types[0]) ? types[0] : [types[0]]
      types.slice(1).forEach(function (type) {
        if (Array.isArray(type) ? !intersection(first, type).length : !first.includes(type)) {
          throwIncompatible(types, parents.concat('type'))
        }
      })
    }

    var allKeys = allUniqueKeys(schemas)

    if (options.deep && contains(allKeys, 'allOf')) {
      return merger({
        allOf: schemas
      }, options, totalSchemas)
    }

    var propertyKeys = allKeys.filter(isPropertyRelated)
    pullAll(allKeys, propertyKeys)

    var itemKeys = allKeys.filter(isItemsRelated)
    pullAll(allKeys, itemKeys)

    allKeys.forEach(function(key) {
      var values = getValues(schemas, key).filter(notUndefined)
      var compacted = annotationProps.includes(key) ? values : uniqWith(values, compareProp(key))

      // arrayprops like anyOf and oneOf must be merged first, as they contains schemas
      // allOf is treated differently alltogether
      if (compacted.length === 1 && contains(schemaArrays, key)) {
        merged[key] = compacted[0].map(function(schema) {
          return mergeSchemas([schema], schema)
        })
        // prop groups must always be resolved
      } else if (compacted.length === 1 && !contains(schemaGroupProps, key) && !contains(schemaProps, key)) {
        merged[key] = compacted[0]
      } else {
        var resolver = options.resolvers[key] || options.resolvers.defaultResolver

        if (!resolver) {
          throw new Error('No resolver found for key ' + key + '. You can provide a resolver for this keyword in the options, or provide a default resolver.')
        }

        var merger
        // get custom merger for groups
        if (contains(schemaGroupProps, key) || contains(schemaArrays, key)) {
          merger = createRequiredSubMerger(mergeSchemas, key, parents)
        } else {
          merger = function(schemas) {
            return mergeSchemas(schemas, null, parents.concat(key))
          }
        }

        var calledWithArray = false
        merged[key] = resolver(compacted, parents.concat(key), merger, options, function(unresolvedSchemas) {
          calledWithArray = Array.isArray(unresolvedSchemas)
          return addToAllOf(unresolvedSchemas)
        })

        if (merged[key] === undefined && !calledWithArray) {
          throwIncompatible(compacted, parents.concat(key))
        } else if (merged[key] === undefined) {
          delete merged[key]
        }
      }
    })

    Object.assign(merged, callGroupResolver(propertyKeys, 'properties', schemas, mergeSchemas, options, parents))
    Object.assign(merged, callGroupResolver(itemKeys, 'items', schemas, mergeSchemas, options, parents))

    function addToAllOf(unresolvedSchemas) {
      merged.allOf = mergeWithArray(merged.allOf, unresolvedSchemas)
    }

    return merged
  }

  var allSchemas = flattenDeep(getAllOf(rootSchema))
  var merged = mergeSchemas(allSchemas)

  return merged
}

merger.options = {
  resolvers: defaultResolvers
}

merger.stoplightResolvers = {
  defaultResolver(values) {
    if (Array.isArray(values)) {
      return values
    }

    return Object.assign({}, ...Object(values))
  },
  example(values) {
    return defaultResolvers.enum(values) || null
  },
  enum(values) {
    return defaultResolvers.enum(compact(values)) || []
  },
  $ref(values) {
    return {}
  }
}

module.exports = merger
