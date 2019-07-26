"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const json_1 = require("@stoplight/json");
const nodes_1 = require("../../graph/nodes");
const scheduler_1 = require("../../scheduler");
const taskHandler_1 = require("../../scheduler/taskHandler");
function createOasHttpPlugin(config) {
    return {
        tasks: [
            {
                operation: scheduler_1.GraphTaskOp.TransformParsed,
                handler: taskHandler_1.createTaskHandler({
                    selector: config.operationSelector,
                    run: (node, api) => {
                        httpOperationRunner(config, node, api);
                    },
                }, `oas${config.version}_operations`),
            },
            {
                operation: scheduler_1.GraphTaskOp.TransformParsed,
                handler: taskHandler_1.createTaskHandler({
                    selector: config.serviceSelector,
                    run: (node, api) => {
                        const nodeData = node.data;
                        if (nodeData.parsed) {
                            api.addNode({
                                category: nodes_1.NodeCategory.Virtual,
                                path: `http_service`,
                                type: "http_service",
                                data: config.transformService({ document: nodeData.parsed }),
                                parentId: node.id,
                            });
                        }
                    },
                }, `oas${config.version}_service`),
            },
        ],
    };
}
exports.createOasHttpPlugin = createOasHttpPlugin;
function getMethod(node) {
    return node.path;
}
function isEqual(prev, value) {
    return JSON.stringify(prev) === JSON.stringify(value);
}
function httpOperationRunner(config, node, api) {
    const sourceNode = node.parentSourceNode;
    if (!sourceNode || !sourceNode.data)
        return;
    const resolvedSpec = sourceNode.data.resolved;
    let data;
    if (resolvedSpec) {
        data = config.transformOperation({
            document: resolvedSpec,
            method: getMethod(node),
            path: json_1.decodePointerFragment(node.relativeJsonPath[1]),
        });
    }
    if (api.task && api.task.op === scheduler_1.GraphTaskOp.TransformParsed && api.task.oldValue !== undefined) {
        const staleVirtualNode = node.children.find(n => n.type === "http_operation");
        if (staleVirtualNode) {
            if (data) {
                if (isEqual(staleVirtualNode.data, data)) {
                    return;
                }
                api.setSourceNodeProp(staleVirtualNode.id, 'data', data);
            }
            else {
                console.log('remove', node.uri, staleVirtualNode.id);
                api.removeNode(staleVirtualNode.id);
            }
            return;
        }
    }
    if (data) {
        api.addNode({
            category: nodes_1.NodeCategory.Virtual,
            path: `${node.path}-virtual`,
            type: "http_operation",
            data,
            parentId: node.id,
        });
    }
}
//# sourceMappingURL=plugin.js.map