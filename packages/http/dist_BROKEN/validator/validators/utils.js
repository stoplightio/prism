"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAgainstSchema = exports.convertAjvErrors = void 0;
const types_1 = require("@stoplight/types");
const O = require("fp-ts/Option");
const function_1 = require("fp-ts/function");
const NonEmptyArray_1 = require("fp-ts/NonEmptyArray");
const ajv_1 = require("ajv");
const _2019_1 = require("ajv/dist/2019");
const _2020_1 = require("ajv/dist/2020");
const ajv_formats_1 = require("ajv-formats");
const dateTime_1 = require("./dateTime");
const unknownFormatSilencerLogger = {
    warn(...args) {
        const firstArg = args[0];
        if (typeof firstArg === 'string' && firstArg.startsWith('unknown format')) {
            return;
        }
        console.warn(...args);
    },
    log: console.log,
    error: console.error,
};
const baseAjvOptions = {
    allErrors: true,
    allowUnionTypes: true,
    allowMatchingProperties: true,
    strict: false,
    logger: unknownFormatSilencerLogger,
};
function createAjvInstances(Ajv) {
    const ajv = new Ajv({ ...baseAjvOptions, coerceTypes: true });
    const ajvNoCoerce = new Ajv({ ...baseAjvOptions, coerceTypes: false });
    ajv_formats_1.default(ajv);
    ajv_formats_1.default(ajvNoCoerce);
    ajv.addFormat('date-time', dateTime_1.fmtDef(dateTime_1.date_time, dateTime_1.compareDateTime));
    ajvNoCoerce.addFormat('date-time', dateTime_1.fmtDef(dateTime_1.date_time, dateTime_1.compareDateTime));
    return {
        coerce: ajv,
        noCoerce: ajvNoCoerce,
    };
}
const ajvInstances = {
    default: createAjvInstances(ajv_1.default),
    draft2019_09: createAjvInstances(_2019_1.default),
    draft2020_12: createAjvInstances(_2020_1.default),
};
const JSON_SCHEMA_DRAFT_2019_09 = /^https?:\/\/json-schema.org\/draft\/2019-09\/schema#?$/;
const JSON_SCHEMA_DRAFT_2020_12 = /^https?:\/\/json-schema.org\/draft\/2020-12\/schema#?$/;
function assignAjvInstance($schema, coerce) {
    const member = coerce ? 'coerce' : 'noCoerce';
    let draft = 'default';
    if (JSON_SCHEMA_DRAFT_2019_09.test($schema)) {
        draft = 'draft2019_09';
    }
    else if (JSON_SCHEMA_DRAFT_2020_12.test($schema)) {
        draft = 'draft2020_12';
    }
    return ajvInstances[draft][member];
}
const convertAjvErrors = (errors, severity, prefix) => function_1.pipe(errors, NonEmptyArray_1.map(error => {
    const allowedParameters = 'allowedValues' in error.params ? `: ${error.params.allowedValues.join(', ')}` : '';
    const detectedAdditionalProperties = 'additionalProperty' in error.params ? `; found '${error.params.additionalProperty}'` : '';
    const errorPath = error.instancePath.split('/').filter(segment => segment !== '');
    const path = prefix ? [prefix, ...errorPath] : errorPath;
    return {
        path,
        code: error.keyword || '',
        message: `${error.message || ''}${allowedParameters}${detectedAdditionalProperties}`,
        severity,
    };
}));
exports.convertAjvErrors = convertAjvErrors;
const validationsFunctionsCache = new WeakMap();
const EMPTY_BUNDLE = { _emptyBundle: true };
function getValidationFunction(ajvInstance, schema, bundle) {
    const bundledFunctionsCache = validationsFunctionsCache.get(schema);
    const bundleKey = typeof bundle === 'object' && bundle !== null ? bundle : EMPTY_BUNDLE;
    if (bundledFunctionsCache) {
        const validationFunction = bundledFunctionsCache.get(bundleKey);
        if (validationFunction) {
            return validationFunction;
        }
    }
    const validationFunction = ajvInstance.compile({
        ...schema,
        __bundled__: bundle,
    });
    if (!bundledFunctionsCache) {
        validationsFunctionsCache.set(schema, new WeakMap());
    }
    validationsFunctionsCache.get(schema).set(bundleKey, validationFunction);
    return validationFunction;
}
const validateAgainstSchema = (value, schema, coerce, prefix, bundle) => function_1.pipe(O.tryCatch(() => getValidationFunction(assignAjvInstance(String(schema.$schema), coerce), schema, bundle)), O.chainFirst(validateFn => O.tryCatch(() => validateFn(value))), O.chain(validateFn => function_1.pipe(O.fromNullable(validateFn.errors), O.chain(NonEmptyArray_1.fromArray))), O.map(errors => exports.convertAjvErrors(errors, types_1.DiagnosticSeverity.Error, prefix)));
exports.validateAgainstSchema = validateAgainstSchema;
