"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nodes_1 = require("../../graph/nodes");
const scheduler_1 = require("../../scheduler");
const taskHandler_1 = require("../../scheduler/taskHandler");
const diagnoseSourceNode_1 = require("./diagnoseSourceNode");
exports.createSpectralPlugin = () => {
    return {
        tasks: [
            {
                operation: scheduler_1.GraphTaskOp.ValidateSourceNode,
                handler: taskHandler_1.createTaskHandler({
                    selector: node => node.category === nodes_1.NodeCategory.Source && (node.spec === nodes_1.Specs.OAS2 || node.spec === nodes_1.Specs.OAS3),
                    run: diagnoseSourceNode_1.createDiagnoseSourceNodeHandler(),
                }, 'spectral'),
            },
        ],
    };
};
//# sourceMappingURL=index.js.map