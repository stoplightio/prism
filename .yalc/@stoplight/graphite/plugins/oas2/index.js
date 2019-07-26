"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const graph_1 = require("../../graph");
const scheduler_1 = require("../../scheduler");
const taskHandler_1 = require("../../scheduler/taskHandler");
const sourceMap_1 = require("./sourceMap");
tslib_1.__exportStar(require("./types"), exports);
exports.oas2NodeSelector = node => node.category === graph_1.NodeCategory.Source && node.spec && node.spec === graph_1.Specs.OAS2 ? true : false;
exports.oas2OperationSelector = node => node.type === `oas2_operation`;
function oas2Plugin() {
    return {
        selector: exports.oas2NodeSelector,
        map: sourceMap_1.createOas2SourceMap(),
    };
}
function createOas2Plugin(sourceMapPlugin = oas2Plugin()) {
    const sourceMapHandler = scheduler_1.createComputeSourceMapHandler(sourceMapPlugin.map);
    return {
        tasks: [
            {
                operation: scheduler_1.GraphTaskOp.ComputeSourceMap,
                handler: taskHandler_1.createTaskHandler({
                    selector: sourceMapPlugin.selector,
                    run: sourceMapHandler,
                }, 'oas2-source-map'),
            },
        ],
        specProvider: {
            spec: graph_1.Specs.OAS2,
            path: /\.oas2\.?/i,
            content(parsed) {
                return parsed && Number.parseInt(String(parsed.swagger)) === 2 ? 1 : 0;
            },
        },
    };
}
exports.createOas2Plugin = createOas2Plugin;
//# sourceMappingURL=index.js.map