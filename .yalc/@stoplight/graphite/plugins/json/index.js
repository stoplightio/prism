"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const json_1 = require("@stoplight/json");
const parseWithPointers_1 = require("@stoplight/json/parseWithPointers");
const graph_1 = require("../../graph");
const scheduler_1 = require("../../scheduler");
const taskHandler_1 = require("../../scheduler/taskHandler");
exports.createJsonParser = (opts = {}) => {
    return {
        selector: node => node.language === graph_1.Languages.Json,
        serialize: parsed => json_1.safeStringify(parsed, undefined, opts.indent || 2),
        deserialize: raw => parseWithPointers_1.parseWithPointers(raw),
    };
};
exports.createJsonPlugin = (jsonParser = exports.createJsonParser()) => {
    return {
        tasks: [
            {
                operation: scheduler_1.GraphTaskOp.DeserializeSourceNode,
                handler: taskHandler_1.createTaskHandler({
                    selector: jsonParser.selector,
                    run: scheduler_1.createDeserializeSourceNodeHandler(jsonParser.deserialize),
                }, 'json'),
            },
            {
                operation: scheduler_1.GraphTaskOp.SerializeSourceNode,
                handler: taskHandler_1.createTaskHandler({
                    selector: jsonParser.selector,
                    run: scheduler_1.createSerializeSourceNodeHandler(jsonParser.serialize),
                }, 'json-serializer'),
            },
        ],
    };
};
//# sourceMappingURL=index.js.map