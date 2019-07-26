"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const graph_1 = require("../../graph");
const scheduler_1 = require("../../scheduler");
const taskHandler_1 = require("../../scheduler/taskHandler");
const sourceMap_1 = require("./sourceMap");
tslib_1.__exportStar(require("./types"), exports);
exports.oas3NodeSelector = node => node.category === graph_1.NodeCategory.Source && node.spec && node.spec === graph_1.Specs.OAS3 ? true : false;
exports.oas3OperationSelector = node => node.type === `oas3_operation`;
function oas3Plugin() {
    return {
        selector: exports.oas3NodeSelector,
        map: sourceMap_1.createOas3SourceMap(),
    };
}
function createOas3Plugin(sourceMapPlugin = oas3Plugin()) {
    const sourceMapHandler = scheduler_1.createComputeSourceMapHandler(sourceMapPlugin.map);
    return {
        tasks: [
            {
                operation: scheduler_1.GraphTaskOp.ComputeSourceMap,
                handler: taskHandler_1.createTaskHandler({
                    selector: sourceMapPlugin.selector,
                    run: sourceMapHandler,
                }, 'oas3-source-map'),
            },
        ],
        specProvider: {
            spec: graph_1.Specs.OAS3,
            path: /\.oas3\.?/i,
            content(parsed) {
                return parsed && parseInt(parsed.openapi) >= 3 ? 1 : 0;
            },
        },
    };
}
exports.createOas3Plugin = createOas3Plugin;
//# sourceMappingURL=index.js.map