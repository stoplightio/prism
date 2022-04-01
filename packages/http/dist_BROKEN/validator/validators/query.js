"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const types_1 = require("@stoplight/types");
const params_1 = require("./params");
const deserializers_1 = require("../deserializers");
const validate = (target, specs, bundle) => params_1.validateParams(target, specs, bundle)({ deserializers: deserializers_1.query, prefix: 'query', defaultStyle: types_1.HttpParamStyles.Form });
exports.validate = validate;
