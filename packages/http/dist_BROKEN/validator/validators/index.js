"use strict";
const body_1 = require("./body");
const headers_1 = require("./headers");
const query_1 = require("./query");
const path_1 = require("./path");
const obj = { validateQuery: query_1.validate, validatePath: path_1.validate, validateHeaders: headers_1.validate, validateBody: body_1.validate };
module.exports = obj;
