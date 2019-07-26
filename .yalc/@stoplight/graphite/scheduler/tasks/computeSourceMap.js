"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const dom_1 = require("../../graph/dom");
const nodes_1 = require("../../graph/nodes");
const utils_1 = require("../../graph/utils");
const scheduler_1 = require("../../scheduler");
const sourceMapper_1 = require("../../sourceMapper");
function createComputeSourceMapHandler(map, createEdges) {
    return (node, taskHandlerApi) => {
        if (node.category !== nodes_1.NodeCategory.Source || !node.data.parsed)
            return;
        const { task, addNode, moveNode, removeNode, getNodeByUri } = taskHandlerApi;
        let currentUriMap = utils_1.computeNodeChildrenUriMap(node, n => n.category === nodes_1.NodeCategory.SourceMap);
        if (task && isComputeSourceMapTask(task) && task.patch) {
            let consumedAllPatchOperations = true;
            for (const operation of task.patch) {
                if (isMoveJsonOp(operation)) {
                    currentUriMap = moveNodeWithPatchOperation(operation, {
                        node,
                        currentUriMap,
                        moveNode,
                    });
                }
                else if (isRemoveJsonOp(operation)) {
                    currentUriMap = removeNodeWithPatchOperation(operation, {
                        node,
                        currentUriMap,
                        removeNode,
                    });
                }
                else {
                    consumedAllPatchOperations = false;
                }
            }
            if (consumedAllPatchOperations)
                return;
        }
        const newUriMap = sourceMapper_1.computeSourceMap(map, node.data.parsed, node.uri).uriMap;
        const added = {};
        const changed = {};
        for (const uri in newUriMap) {
            if (!newUriMap.hasOwnProperty(uri))
                continue;
            if (currentUriMap[uri]) {
                const currentNode = getNodeByUri(uri);
                if (!currentNode)
                    continue;
                changed[uri] = currentNode;
                continue;
            }
            const n = newUriMap[uri];
            const parentUri = uri.replace(new RegExp(`/${n.path}$`), '');
            const parent = currentUriMap[parentUri] || added[parentUri] || node;
            const newNode = addNode(Object.assign({}, n, { parentId: parent.id }));
            added[newNode.uri] = newNode;
        }
        const currentUriMapKeys = Object.keys(currentUriMap);
        const newUriMapKeys = Object.keys(newUriMap);
        const toRemove = lodash_1.difference(currentUriMapKeys, newUriMapKeys);
        const removedIds = {};
        for (const uri of toRemove) {
            const n = currentUriMap[uri];
            if (!n || !n.id)
                continue;
            if (!n.parentId || !removedIds[n.parentId]) {
                removeNode(n.id);
            }
            removedIds[n.id] = true;
        }
        if (createEdges) {
            createEdges([...lodash_1.values(added), ...lodash_1.values(changed)], taskHandlerApi);
        }
    };
}
exports.createComputeSourceMapHandler = createComputeSourceMapHandler;
function isMoveJsonOp(operation) {
    return operation.op === dom_1.JsonOp.Move;
}
function isRemoveJsonOp(operation) {
    return operation.op === dom_1.JsonOp.Remove;
}
function isComputeSourceMapTask(task) {
    return task.op === scheduler_1.GraphTaskOp.ComputeSourceMap;
}
function moveNodeWithPatchOperation(operation, { node, currentUriMap, moveNode, }) {
    const fromUri = node.uri + utils_1.encodeJsonPath(operation.from);
    const toUri = node.uri + utils_1.encodeJsonPath(operation.path);
    if (!currentUriMap.hasOwnProperty(fromUri)) {
        return currentUriMap;
    }
    const movedNode = currentUriMap[fromUri];
    const parentNode = currentUriMap[node.uri + utils_1.encodeJsonPath(operation.path.slice(0, -1))];
    moveNode(movedNode.id, parentNode.id, toUri.substring(toUri.lastIndexOf('/') + 1));
    delete currentUriMap[fromUri];
    currentUriMap[movedNode.uri] = movedNode;
    return currentUriMap;
}
function removeNodeWithPatchOperation(operation, { node, currentUriMap, removeNode, }) {
    const nodeUri = node.uri + utils_1.encodeJsonPath(operation.path);
    if (!currentUriMap.hasOwnProperty(nodeUri)) {
        return currentUriMap;
    }
    const removedNode = currentUriMap[nodeUri];
    removeNode(removedNode.id);
    for (const uri in currentUriMap) {
        if (uri.substring(0, nodeUri.length) === nodeUri) {
            delete currentUriMap[uri];
        }
    }
    return currentUriMap;
}
//# sourceMappingURL=computeSourceMap.js.map