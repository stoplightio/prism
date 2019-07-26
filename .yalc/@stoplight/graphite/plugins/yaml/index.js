"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yaml_1 = require("@stoplight/yaml");
const graph_1 = require("../../graph");
const scheduler_1 = require("../../scheduler");
const taskHandler_1 = require("../../scheduler/taskHandler");
exports.createYamlParser = (opts = {}) => {
    return {
        selector: node => node.language === graph_1.Languages.Yaml,
        serialize: parsed => yaml_1.safeStringify(parsed, {
            indent: opts.indent || 2,
            noRefs: true,
        }),
        deserialize: raw => yaml_1.parseWithPointers(raw),
    };
};
exports.createYamlPlugin = (yamlParser = exports.createYamlParser()) => {
    return {
        tasks: [
            {
                operation: scheduler_1.GraphTaskOp.DeserializeSourceNode,
                handler: taskHandler_1.createTaskHandler({
                    selector: yamlParser.selector,
                    run: scheduler_1.createDeserializeSourceNodeHandler(yamlParser.deserialize),
                }, 'yaml'),
            },
            {
                operation: scheduler_1.GraphTaskOp.SerializeSourceNode,
                handler: taskHandler_1.createTaskHandler({
                    selector: yamlParser.selector,
                    run: scheduler_1.createSerializeSourceNodeHandler(yamlParser.serialize),
                }, 'yaml-serializer'),
            },
        ],
    };
};
//# sourceMappingURL=index.js.map