"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const renameObjectKey_1 = require("@stoplight/json/renameObjectKey");
const lifecycle_1 = require("@stoplight/lifecycle");
const fast_json_patch_1 = require("fast-json-patch");
const immer_1 = require("immer");
const lodash_1 = require("lodash");
const mobx_1 = require("mobx");
const notifier_1 = require("../../notifier");
const edges_1 = require("../edges");
const nodes_1 = require("../nodes");
const utils_1 = require("../utils");
const patches_1 = require("../utils/patches");
const types_1 = require("./types");
function applyPatch(dom, patch, notifier, sourceNodeService) {
    return {
        operations: patch.operations.map(applyOperationToDom(dom, notifier, sourceNodeService, patch)),
        trace: patch.trace,
    };
}
exports.applyPatch = applyPatch;
function applyOperationToDom(dom, notifier, sourceNodeService, patch) {
    return function applyOperation(operation) {
        const tracedOperation = Object.assign({ trace: patch.trace }, operation);
        switch (tracedOperation.op) {
            case types_1.GraphOp.AddNode:
                return applyAddNodeOperation(dom, tracedOperation, sourceNodeService, notifier);
            case types_1.GraphOp.MoveNode:
                return applyMoveNode(dom, tracedOperation, notifier);
            case types_1.GraphOp.RemoveNode:
                return applyRemoveNodeOperation(dom, tracedOperation, notifier);
            case types_1.GraphOp.SetSourceNodeDiagnostics:
                return applySetSourceNodeDiagnostics(dom, tracedOperation, notifier);
            case types_1.GraphOp.SetSourceNodeProp:
                return applySetSourceNodeProp(dom, tracedOperation, notifier);
            case types_1.GraphOp.PatchSourceNodeProp:
                return applyPatchSourceNodeProp(dom, tracedOperation, notifier);
            case types_1.GraphOp.AddEdge:
                return applyAddEdge(dom, tracedOperation, notifier);
            case types_1.GraphOp.RemoveEdge:
                return applyRemoveEdge(dom, tracedOperation, notifier);
            case types_1.GraphOp.PatchEdgeData:
                return applyPatchEdgeData(dom, tracedOperation, notifier);
            default:
                const _exhaustiveMatch = tracedOperation;
                throw new Error('Non-exhausive match for applyOperation()');
        }
    };
}
function applyAddNodeOperation(dom, operation, sourceNodeService, notifier) {
    const { node } = operation;
    const parent = node.parentId ? dom.nodes[node.parentId] : undefined;
    const newNode = createNode(node, parent, notifier, sourceNodeService, operation.trace);
    dom.nodes[node.id] = newNode;
    dom.nodesByUri[newNode.uri] = newNode;
    dom.nodesByType[newNode.type] = dom.nodesByType[newNode.type] || mobx_1.observable([], undefined, { deep: false });
    dom.nodesByType[newNode.type].push(newNode);
    notifier.emit(notifier_1.GraphiteEvent.DidAddNode, operation);
    newNode.disposables.push(lifecycle_1.createDisposable(mobx_1.observe(newNode, 'uri', ({ newValue, oldValue }) => {
        if (oldValue) {
            delete dom.nodesByUri[oldValue];
        }
        notifier.emit(notifier_1.GraphiteEvent.DidUpdateNodeUri, {
            id: newNode.id,
            newUri: newValue,
            oldUri: oldValue,
        });
        dom.nodesByUri[newValue] = newNode;
    })));
    return operation;
}
function createNode(node, parent, notifier, sourceNodeService, trace) {
    switch (node.category) {
        case nodes_1.NodeCategory.Source:
            const sourceNode = applyAddSourceNode(node, parent);
            sourceNodeService.observeSpec(sourceNode);
            return sourceNode;
        case nodes_1.NodeCategory.SourceMap:
            return applyAddSourceMapNode(node, parent, notifier, trace);
        case nodes_1.NodeCategory.Virtual:
            return applyAddVirtualNode(node, parent);
        default:
            const _exhaustiveMatch = node;
            throw new Error('Non-exhausive match for createNode()');
    }
}
function applyAddSourceNode(node, parent) {
    if (parent && parent.category !== nodes_1.NodeCategory.Source) {
        throw new Error(`The parent of a source node may be another source node, but you provided a ${parent.category} node.`);
    }
    return new nodes_1.SourceNode(node, parent);
}
function applyAddSourceMapNode(node, parent, notifier, trace) {
    if (!parent || parent.category === nodes_1.NodeCategory.Virtual) {
        throw new Error('The parent of a source_map node must be another source or source_map node.');
    }
    const dataUpdateHandler = (event) => {
        return ({ oldValue, newValue }) => {
            if (newValue === undefined)
                return;
            notifier.emit(event, {
                id: sourceMapNode.id,
                oldValue,
                newValue,
                trace,
            });
        };
    };
    const sourceMapNode = new nodes_1.SourceMapNode(node, parent);
    sourceMapNode.disposables.pushAll([
        lifecycle_1.createDisposable(mobx_1.observe(sourceMapNode.data, 'parsed', dataUpdateHandler(notifier_1.GraphiteEvent.DidUpdateSourceMapNodeData))),
        lifecycle_1.createDisposable(mobx_1.observe(sourceMapNode.data, 'resolved', dataUpdateHandler(notifier_1.GraphiteEvent.DidUpdateSourceMapNodeResolved))),
    ]);
    return sourceMapNode;
}
function applyAddVirtualNode(node, parent) {
    if (!parent) {
        throw new Error('Virtual nodes must have a parent, and one was not provided.');
    }
    return new nodes_1.VirtualNode(node, parent);
}
function applyMoveNode(dom, operation, notifier) {
    const node = lookupNode(dom, operation.id);
    if (operation.newParentId === null) {
        node.parent = undefined;
    }
    else if (operation.newParentId && operation.newParentId !== node.parentId) {
        const newParent = lookupNode(dom, operation.newParentId);
        if (!newParent) {
        }
        else {
            node.parent = newParent;
        }
    }
    if (operation.newPath && operation.newPath !== node.path) {
        node.path = operation.newPath;
    }
    notifier.emit(notifier_1.GraphiteEvent.DidMoveNode, operation);
    return operation;
}
function applyRemoveNodeOperation(dom, operation, notifier) {
    const node = lookupNode(dom, operation.id);
    if (node.parent) {
        lodash_1.pull(node.parent.children, node);
    }
    removeNodeAndChildren(dom, node);
    notifier.emit(notifier_1.GraphiteEvent.DidRemoveNode, operation);
    return operation;
}
function removeNodeAndChildren(dom, node) {
    for (const child of node.children) {
        removeNodeAndChildren(dom, child);
    }
    removeEdges(dom, node.outgoingEdges);
    removeEdges(dom, node.incomingEdges);
    delete dom.nodes[node.id];
    delete dom.nodesByUri[node.uri];
    lodash_1.remove(dom.nodesByType[node.type], n => n.id === node.id);
    node.dispose();
}
function applySetSourceNodeDiagnostics(dom, operation, notifier) {
    const node = lookupNode(dom, operation.id);
    if (node.category !== nodes_1.NodeCategory.Source) {
        throw new Error(`Setting the diagnostics property is only allowed on source nodes.`);
    }
    const { source } = operation;
    if (!source) {
        throw new Error(`Source must be supplied when setting node diagnostics.`);
    }
    const withSource = operation.diagnostics.map(d => (Object.assign({}, d, { source })));
    const newDiagnostics = immer_1.produce(node.data.diagnostics, draft => {
        draft = node.data.diagnostics.filter(d => d.source !== source);
        draft = draft.concat(withSource);
        return draft;
    });
    if (!lodash_1.isEqual(node.data.diagnostics, newDiagnostics)) {
        applySetSourceNodeProp(dom, {
            op: types_1.GraphOp.SetSourceNodeProp,
            id: operation.id,
            prop: 'data.diagnostics',
            value: newDiagnostics,
            trace: operation.trace,
        }, notifier);
    }
    return operation;
}
function applySetSourceNodeProp(dom, operation, notifier) {
    const node = lookupNode(dom, operation.id);
    if (operation.value !== lodash_1.get(node, operation.prop)) {
        lodash_1.set(node, operation.prop, operation.value);
        notifier.emit(notifier_1.GraphiteEvent.DidSetSourceNodeProp, operation);
    }
    return operation;
}
function applyPatchSourceNodeProp(dom, operation, notifier) {
    const node = lookupNode(dom, operation.id);
    if (node.category !== nodes_1.NodeCategory.Source) {
        throw new Error('Setting the raw property is only allowed on source nodes.');
    }
    lodash_1.set(node, operation.prop, applyJsonPatch(lodash_1.get(node, operation.prop), operation.value));
    notifier.emit(notifier_1.GraphiteEvent.DidPatchSourceNodeProp, operation);
    return operation;
}
function applyAddEdge(dom, operation, notifier) {
    const edge = edges_1.createEdge({
        id: operation.id,
        type: operation.type,
        source: dom.nodes[operation.sourceId],
        target: dom.nodes[operation.targetId],
        data: operation.data,
    });
    dom.edges[operation.id] = edge;
    notifier.emit(notifier_1.GraphiteEvent.DidAddEdge, operation);
    return operation;
}
function applyRemoveEdge(dom, operation, notifier) {
    removeEdge(dom, dom.edges[operation.id]);
    notifier.emit(notifier_1.GraphiteEvent.DidRemoveEdge, operation);
    return operation;
}
function removeEdges(dom, edges) {
    for (const edge of edges) {
        removeEdge(dom, edge);
    }
}
function removeEdge(dom, edge) {
    edge.dispose();
    delete dom.edges[edge.id];
}
function applyPatchEdgeData(dom, operation, notifier) {
    throw new Error('Not implemented.');
    notifier.emit(notifier_1.GraphiteEvent.DidPatchEdgeData, operation);
    return operation;
}
function applyJsonPatch(value, patch) {
    let transformed = value;
    for (const operation of patch) {
        transformed = applyJsonOperation(transformed, operation);
    }
    return transformed;
}
exports.applyJsonPatch = applyJsonPatch;
function applyJsonOperation(value, operation) {
    if (operation.op === types_1.JsonOp.Text) {
        return applyTextOperation(String(value || ''), operation);
    }
    if (operation.path.length === 0 && (operation.op === types_1.JsonOp.Add || operation.op === types_1.JsonOp.Replace)) {
        return operation.value;
    }
    if (operation.op === types_1.JsonOp.Move) {
        const basePath = operation.from.slice(0, -1);
        if (lodash_1.isEqual(basePath, operation.path.slice(0, -1))) {
            return immer_1.produce(value || {}, (draft) => {
                if (operation.path.length > 1) {
                    lodash_1.set(draft, basePath, renameObjectKey_1.renameObjectKey(lodash_1.get(draft, basePath), String(operation.from[operation.from.length - 1]), String(operation.path[operation.path.length - 1])));
                    return draft;
                }
                return renameObjectKey_1.renameObjectKey(draft, String(operation.from[operation.from.length - 1]), String(operation.path[operation.path.length - 1]));
            });
        }
    }
    if (operation.op === types_1.JsonOp.Add || operation.op === types_1.JsonOp.Replace) {
        return immer_1.produce(value || {}, (draft) => {
            patches_1.setWithPush(draft, operation);
        });
    }
    return immer_1.produce(value || {}, (draft) => {
        const op = Object.assign({}, operation, { path: utils_1.encodeJsonPath(operation.path) }, ('from' in operation && { from: utils_1.encodeJsonPath(operation.from) }));
        fast_json_patch_1.applyOperation(draft, op);
    });
}
function applyTextOperation(value, operation) {
    return `${value.slice(0, operation.offset)}${operation.value}${value.slice(operation.offset + operation.length)}`;
}
exports.applyTextOperation = applyTextOperation;
function lookupNode(dom, id) {
    const node = dom.nodes[id];
    if (!node) {
        throw new Error(`Node with id ${id} does not exist.`);
    }
    return node;
}
//# sourceMappingURL=patch.js.map