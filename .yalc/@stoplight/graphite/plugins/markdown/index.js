"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const markdown_1 = require("@stoplight/markdown");
const graph_1 = require("../../graph");
const scheduler_1 = require("../../scheduler");
const taskHandler_1 = require("../../scheduler/taskHandler");
exports.createParser = () => {
    return {
        selector: node => node.language === graph_1.Languages.Markdown,
        serialize: parsed => markdown_1.stringify(parsed),
        deserialize: raw => markdown_1.parseWithPointers(raw),
    };
};
exports.createPlugin = (parser = exports.createParser()) => {
    return {
        tasks: [
            {
                operation: scheduler_1.GraphTaskOp.DeserializeSourceNode,
                handler: taskHandler_1.createTaskHandler({
                    selector: parser.selector,
                    run: scheduler_1.createDeserializeSourceNodeHandler(parser.deserialize),
                }, 'markdown'),
            },
            {
                operation: scheduler_1.GraphTaskOp.SerializeSourceNode,
                handler: taskHandler_1.createTaskHandler({
                    selector: parser.selector,
                    run: scheduler_1.createSerializeSourceNodeHandler(parser.serialize),
                }, 'markdown-serializer'),
            },
        ],
        specProvider: {
            spec: graph_1.Specs.Markdown,
            path: /\.(?:md|markdown)$/i,
        },
    };
};
//# sourceMappingURL=index.js.map