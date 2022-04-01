"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParams = void 0;
const types_1 = require("@stoplight/types");
const lodash_1 = require("lodash");
const E = require("fp-ts/Either");
const O = require("fp-ts/Option");
const NEA = require("fp-ts/NonEmptyArray");
const function_1 = require("fp-ts/function");
const utils_1 = require("./utils");
const schemaCache = new WeakMap();
const validateParams = (target, specs, bundle) => ({ deserializers, prefix, defaultStyle, }) => {
    const deprecatedWarnings = specs
        .filter(spec => spec.deprecated && target[spec.name])
        .map(spec => ({
        path: [prefix, spec.name],
        code: 'deprecated',
        message: `${lodash_1.upperFirst(prefix)} param ${spec.name} is deprecated`,
        severity: types_1.DiagnosticSeverity.Warning,
    }));
    return function_1.pipe(NEA.fromArray(specs), O.map(specs => {
        var _a;
        const schema = (_a = schemaCache.get(specs)) !== null && _a !== void 0 ? _a : createJsonSchemaFromParams(specs);
        if (!schemaCache.has(specs)) {
            schemaCache.set(specs, schema);
        }
        const parameterValues = lodash_1.pickBy(lodash_1.mapValues(lodash_1.keyBy(specs, s => s.name.toLowerCase()), el => {
            const resolvedStyle = el.style || defaultStyle;
            const deserializer = deserializers[resolvedStyle];
            return deserializer
                ? deserializer(el.name.toLowerCase(), lodash_1.mapKeys(target, (_value, key) => key.toLowerCase()), schema.properties && schema.properties[el.name.toLowerCase()], el.explode || false)
                : undefined;
        }));
        return { parameterValues, schema };
    }), O.chain(({ parameterValues, schema }) => utils_1.validateAgainstSchema(parameterValues, schema, true, prefix, bundle)), O.map(schemaDiagnostic => NEA.concat(schemaDiagnostic, deprecatedWarnings)), O.alt(() => NEA.fromArray(deprecatedWarnings)), E.fromOption(() => target), E.swap);
};
exports.validateParams = validateParams;
function createJsonSchemaFromParams(params) {
    return {
        type: 'object',
        properties: lodash_1.pickBy(lodash_1.mapValues(lodash_1.keyBy(params, p => p.name.toLocaleLowerCase()), 'schema')),
        required: lodash_1.compact(params.map(m => (m.required ? m.name.toLowerCase() : undefined))),
    };
}
