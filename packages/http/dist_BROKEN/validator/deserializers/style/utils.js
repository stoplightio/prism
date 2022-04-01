"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createObjectFromKeyValList = void 0;
function createObjectFromKeyValList(items) {
    return items.reduce((obj, item, i) => {
        if (i % 2 === 0) {
            obj[item] = undefined;
        }
        else {
            obj[items[i - 1]] = item;
        }
        return obj;
    }, {});
}
exports.createObjectFromKeyValList = createObjectFromKeyValList;
