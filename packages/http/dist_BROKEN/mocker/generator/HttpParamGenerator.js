"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = exports.improveSchema = void 0;
const O = require("fp-ts/Option");
const function_1 = require("fp-ts/function");
const JSONSchema_1 = require("./JSONSchema");
function improveSchema(schema) {
    const newSchema = { ...schema };
    if (newSchema.type === 'integer' || newSchema.type === 'number') {
        if (!newSchema.minimum) {
            newSchema.minimum = 1;
        }
        if (!newSchema.maximum) {
            newSchema.maximum = 1000;
        }
    }
    if (newSchema.type === 'string' && !newSchema.format && !newSchema.enum && !newSchema.pattern) {
        newSchema['x-faker'] = 'lorem.word';
    }
    else if (newSchema.type === 'object' && newSchema.properties) {
        newSchema.properties = Object.entries(newSchema.properties).reduce((r, [k, v]) => {
            r[k] = typeof v === 'boolean' ? v : improveSchema(v);
            return r;
        }, {});
    }
    else if (newSchema.type === 'array' && typeof newSchema.items === 'object') {
        newSchema.items = Array.isArray(newSchema.items)
            ? newSchema.items.map(subSchema => (typeof subSchema === 'boolean' ? subSchema : improveSchema(subSchema)))
            : improveSchema(newSchema.items);
    }
    return newSchema;
}
exports.improveSchema = improveSchema;
function pickStaticExample(examples) {
    return function_1.pipe(examples, O.chainNullableK(exs => exs[Math.floor(Math.random() * exs.length)]), O.chainNullableK(example => example.value));
}
function generate(param) {
    return function_1.pipe(O.fromNullable(param.examples), pickStaticExample, O.alt(() => function_1.pipe(O.fromNullable(param.schema), O.map(improveSchema), O.chain(schema => O.fromEither(JSONSchema_1.generate({}, schema))))));
}
exports.generate = generate;
