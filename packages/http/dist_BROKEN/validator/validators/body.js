"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.findContentByMediaTypeOrFirst = exports.decodeUriEntities = exports.splitUriParams = exports.deserializeFormBody = void 0;
const types_1 = require("@stoplight/types");
const A = require("fp-ts/Array");
const E = require("fp-ts/Either");
const O = require("fp-ts/Option");
const NEA = require("fp-ts/NonEmptyArray");
const function_1 = require("fp-ts/function");
const lodash_1 = require("lodash");
const type_is_1 = require("type-is");
const deserializers_1 = require("../deserializers");
const utils_1 = require("./utils");
const types_2 = require("./types");
const filterRequiredProperties_1 = require("../../utils/filterRequiredProperties");
function deserializeFormBody(schema, encodings, decodedUriParams) {
    if (!schema.properties) {
        return decodedUriParams;
    }
    return function_1.pipe(Object.keys(schema.properties), A.reduce({}, (deserialized, property) => {
        var _a;
        deserialized[property] = decodedUriParams[property];
        const encoding = encodings.find(enc => enc.property === property);
        if (encoding && encoding.style) {
            const deserializer = deserializers_1.body[encoding.style];
            const propertySchema = (_a = schema.properties) === null || _a === void 0 ? void 0 : _a[property];
            if (propertySchema && typeof propertySchema !== 'boolean')
                deserialized[property] = deserializer(property, decodedUriParams, propertySchema);
        }
        return deserialized;
    }));
}
exports.deserializeFormBody = deserializeFormBody;
function splitUriParams(target) {
    return target.split('&').reduce((result, pair) => {
        const [key, ...rest] = pair.split('=');
        result[key] = rest.join('=');
        return result;
    }, {});
}
exports.splitUriParams = splitUriParams;
function decodeUriEntities(target) {
    return Object.entries(target).reduce((result, [k, v]) => {
        result[decodeURIComponent(k)] = decodeURIComponent(v);
        return result;
    }, {});
}
exports.decodeUriEntities = decodeUriEntities;
function findContentByMediaTypeOrFirst(specs, mediaType) {
    return function_1.pipe(specs, A.findFirst(spec => !!type_is_1.is(mediaType, [spec.mediaType])), O.alt(() => A.head(specs)), O.map(content => ({ mediaType, content })));
}
exports.findContentByMediaTypeOrFirst = findContentByMediaTypeOrFirst;
function deserializeAndValidate(content, schema, target, bundle) {
    const encodings = lodash_1.get(content, 'encodings', []);
    const encodedUriParams = splitUriParams(target);
    return function_1.pipe(validateAgainstReservedCharacters(encodedUriParams, encodings), E.map(decodeUriEntities), E.map(decodedUriEntities => deserializeFormBody(schema, encodings, decodedUriEntities)), E.chain(deserialised => function_1.pipe(utils_1.validateAgainstSchema(deserialised, schema, true, undefined, bundle), E.fromOption(() => deserialised), E.swap)));
}
function memoizeSchemaNormalizer(normalizer) {
    const cache = new WeakMap();
    return (schema) => {
        const cached = cache.get(schema);
        if (!cached) {
            const newSchema = normalizer(schema);
            cache.set(schema, newSchema);
            return newSchema;
        }
        return cached;
    };
}
const normalizeSchemaProcessorMap = {
    [types_2.ValidationContext.Input]: memoizeSchemaNormalizer(filterRequiredProperties_1.stripReadOnlyProperties),
    [types_2.ValidationContext.Output]: memoizeSchemaNormalizer(filterRequiredProperties_1.stripWriteOnlyProperties),
};
const validate = (target, specs, context, mediaType, bundle) => {
    const findContentByMediaType = function_1.pipe(O.Do, O.bind('mediaType', () => O.fromNullable(mediaType)), O.bind('contentResult', ({ mediaType }) => findContentByMediaTypeOrFirst(specs, mediaType)), O.alt(() => O.some({ contentResult: { content: specs[0] || {}, mediaType: 'random' } })), O.bind('schema', ({ contentResult }) => function_1.pipe(O.fromNullable(contentResult.content.schema), O.chain(normalizeSchemaProcessorMap[context]))));
    return function_1.pipe(findContentByMediaType, O.fold(() => E.right(target), ({ contentResult: { content, mediaType: mt }, schema }) => function_1.pipe(mt, O.fromPredicate(mediaType => !!type_is_1.is(mediaType, ['application/x-www-form-urlencoded'])), O.fold(() => function_1.pipe(utils_1.validateAgainstSchema(target, schema, false, undefined, bundle), E.fromOption(() => target), E.swap), () => function_1.pipe(target, E.fromPredicate((target) => typeof target === 'string', () => [{ message: 'Target is not a string', code: '422', severity: types_1.DiagnosticSeverity.Error }]), E.chain(target => deserializeAndValidate(content, schema, target)))), E.mapLeft(diagnostics => applyPrefix('body', diagnostics)))));
};
exports.validate = validate;
function applyPrefix(prefix, diagnostics) {
    return function_1.pipe(diagnostics, NEA.map(d => ({ ...d, path: [prefix, ...(d.path || [])] })));
}
function validateAgainstReservedCharacters(encodedUriParams, encodings) {
    return function_1.pipe(encodings, A.reduce([], (diagnostics, encoding) => {
        const allowReserved = lodash_1.get(encoding, 'allowReserved', false);
        const property = encoding.property;
        const value = encodedUriParams[property];
        if (!allowReserved && /[/?#[\]@!$&'()*+,;=]/.test(value)) {
            diagnostics.push({
                path: [property],
                message: 'Reserved characters used in request body',
                severity: types_1.DiagnosticSeverity.Error,
            });
        }
        return diagnostics;
    }), diagnostics => (A.isNonEmpty(diagnostics) ? E.left(diagnostics) : E.right(encodedUriParams)));
}
