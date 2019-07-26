"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const json_1 = require("@stoplight/json");
const lodash_1 = require("lodash");
const dom_1 = require("../dom");
function setWithPush(object, { path, value, op }) {
    if (!lodash_1.isObject(object)) {
        return object;
    }
    const length = path.length;
    const lastIndex = length - 1;
    let index = -1;
    let nested = object;
    while (nested != null && ++index < length) {
        let key = json_1.decodePointerFragment(String(path[index]));
        let newValue = value;
        if (index !== lastIndex) {
            const objValue = nested[key];
            newValue = lodash_1.isObject(objValue) ? objValue : isIndex(String(path[index + 1])) ? [] : {};
        }
        if (key === '-' && Array.isArray(nested)) {
            key = String(nested.length);
        }
        if (op === dom_1.JsonOp.Add && !Number.isNaN(Number(key)) && Array.isArray(nested)) {
            nested.splice(Number(key), 0, newValue);
        }
        else {
            nested[key] = newValue;
        }
        nested = nested[key];
    }
    return object;
}
exports.setWithPush = setWithPush;
function isIndex(value) {
    return value.match(/^(?:0|[1-9]\d*)$/) || value === '-';
}
//# sourceMappingURL=patches.js.map