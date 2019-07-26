"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const mobx_1 = require("mobx");
const uuidv4 = require("uuid/v4");
const errorReporter_1 = require("../errorReporter");
const types_1 = require("../notifier/types");
const types_2 = require("../types");
const dom_1 = require("./dom");
const sourceService_1 = require("./nodes/sourceService");
const utils_1 = require("./utils");
function createGraph(props) {
    return new Graph(props);
}
exports.createGraph = createGraph;
class Graph {
    constructor(props) {
        this.dom = {
            nodes: mobx_1.observable({}, undefined, {
                deep: false,
            }),
            edges: mobx_1.observable({}, undefined, {
                deep: false,
            }),
            nodesByUri: {},
            nodesByType: mobx_1.observable({}, undefined, {
                deep: false,
            }),
        };
        this.getNodeById = (id) => {
            return this.dom.nodes[id];
        };
        this.getNodeByUri = (uri) => {
            return this.dom.nodesByUri[uri];
        };
        this.getNodesByType = (type) => {
            return this.dom.nodesByType[type] || [];
        };
        this.id = props.id;
        this._idGenerator = node => generateNodeId(node, props.idGenerator || exports.defaultIdGenerator, this);
        this.notifier = props.notifier;
        this.sourceNodeService = new sourceService_1.SourceNodeService(this);
    }
    get nodeValues() {
        return Object.values(this.dom.nodes);
    }
    get sourceNodes() {
        return this.nodeValues.filter(utils_1.isSourceNode);
    }
    get virtualNodes() {
        return this.nodeValues.filter(utils_1.isVirtualNode);
    }
    get rootNodes() {
        return this.sourceNodes.filter(utils_1.isRootNode);
    }
    applyPatch(patch) {
        const patchWithTrace = Object.assign({}, patch, { trace: Object.assign({ instanceId: this.id }, patch.trace) });
        const result = dom_1.applyPatch(this.dom, patch, this.notifier, this.sourceNodeService);
        this.notifier.emit(types_1.GraphiteEvent.DidPatch, patchWithTrace);
        return result;
    }
    addNode(node, trace) {
        const existingByUri = this.getNodeByPathWithParent(node.path, node.parentId);
        if (existingByUri)
            return existingByUri;
        const id = node.id || this._idGenerator(node);
        const existingById = this.dom.nodes[id];
        if (existingById) {
            console.warn(`Warning: addNode() node with id ${id} already exists. It has uri '${existingById.uri}'.`);
        }
        this.applyPatch({
            operations: [
                {
                    op: dom_1.GraphOp.AddNode,
                    node: Object.assign({}, node, { id }),
                },
            ],
            trace: trace || {
                instanceId: this.id,
            },
        });
        return this.dom.nodes[id];
    }
    addEdge(sourceId, targetId, type, data, trace) {
        const id = uuidv4();
        this.applyPatch({
            operations: [
                {
                    op: dom_1.GraphOp.AddEdge,
                    id,
                    type,
                    sourceId,
                    targetId,
                    data,
                },
            ],
            trace: trace || {
                instanceId: this.id,
            },
        });
        return this.dom.edges[id];
    }
    setSourceNodeDiagnostics(id, source, diagnostics, trace) {
        this.applyPatch({
            operations: [
                {
                    op: dom_1.GraphOp.SetSourceNodeDiagnostics,
                    id,
                    source,
                    diagnostics,
                },
            ],
            trace: trace || {
                instanceId: this.id,
            },
        });
    }
    setSourceNodeProp(id, prop, value, trace) {
        this.applyPatch({
            operations: [
                {
                    op: dom_1.GraphOp.SetSourceNodeProp,
                    id,
                    prop,
                    value,
                },
            ],
            trace: trace || {
                instanceId: this.id,
            },
        });
    }
    reportError(nodeId, error, trace) {
        const pluginError = {
            data: error,
            message: error.message,
            nodeId,
            code: types_2.GraphiteErrorCode.Plugin,
            trace: trace || {
                instanceId: this.id,
            },
        };
        errorReporter_1.errorReporter.reportError(pluginError);
    }
    patchSourceNodeProp(id, prop, value, trace) {
        this.applyPatch({
            operations: [
                {
                    op: dom_1.GraphOp.PatchSourceNodeProp,
                    id,
                    prop,
                    value,
                },
            ],
            trace: trace || {
                instanceId: this.id,
            },
        });
    }
    moveNode(id, newParentId, newPath, trace = {}) {
        this.applyPatch({
            operations: [
                {
                    op: dom_1.GraphOp.MoveNode,
                    id,
                    newParentId,
                    newPath,
                },
            ],
            trace,
        });
    }
    removeNode(id, trace) {
        this.applyPatch({
            operations: [
                {
                    op: dom_1.GraphOp.RemoveNode,
                    id,
                },
            ],
            trace: trace || {
                instanceId: this.id,
            },
        });
    }
    removeEdge(id, trace) {
        this.applyPatch({
            operations: [
                {
                    op: dom_1.GraphOp.RemoveEdge,
                    id,
                },
            ],
            trace: trace || {
                instanceId: this.id,
            },
        });
    }
    printTree() {
        return utils_1.printTree(this.rootNodes);
    }
    dehydrate() {
        return dehydrate(this.dom);
    }
    dispose() {
    }
    getNodeByPathWithParent(path, parentId) {
        const parent = parentId && this.getNodeById(parentId);
        const uri = utils_1.combinePathAndUri(path, parent ? parent.uri : '');
        return this.getNodeByUri(uri);
    }
}
tslib_1.__decorate([
    mobx_1.computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], Graph.prototype, "nodeValues", null);
tslib_1.__decorate([
    mobx_1.computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], Graph.prototype, "sourceNodes", null);
tslib_1.__decorate([
    mobx_1.computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], Graph.prototype, "virtualNodes", null);
tslib_1.__decorate([
    mobx_1.computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], Graph.prototype, "rootNodes", null);
tslib_1.__decorate([
    mobx_1.action.bound,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Graph.prototype, "applyPatch", null);
tslib_1.__decorate([
    mobx_1.action.bound,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Graph.prototype, "addNode", null);
tslib_1.__decorate([
    mobx_1.action.bound,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, String, Number, Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Graph.prototype, "addEdge", null);
tslib_1.__decorate([
    mobx_1.action.bound,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, String, Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Graph.prototype, "setSourceNodeProp", null);
tslib_1.__decorate([
    mobx_1.action.bound,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, String, Array, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Graph.prototype, "patchSourceNodeProp", null);
tslib_1.__decorate([
    mobx_1.action.bound,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, Object, String, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Graph.prototype, "moveNode", null);
tslib_1.__decorate([
    mobx_1.action.bound,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Graph.prototype, "removeNode", null);
tslib_1.__decorate([
    mobx_1.action.bound,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Graph.prototype, "removeEdge", null);
exports.addNodeTree = mobx_1.action((helpers, tree, parentId) => {
    for (const node of tree) {
        const n = helpers.addNode(Object.assign({}, node, { parentId }));
        if (node.children && node.children.length) {
            exports.addNodeTree(helpers, node.children, n.id);
        }
    }
});
exports.defaultIdGenerator = () => uuidv4();
function generateNodeId(node, idGenerator, nodeFinder) {
    const parent = node.parentId ? nodeFinder.getNodeById(node.parentId) : undefined;
    return idGenerator(node, utils_1.combinePathAndUri(node.path, parent ? parent.uri : undefined));
}
exports.generateNodeId = generateNodeId;
function dehydrate(data) {
    const dehydrated = {
        nodes: {},
    };
    for (const id in data.nodes) {
        if (!{}.hasOwnProperty.call(data.nodes, id))
            continue;
        dehydrated.nodes[id] = data.nodes[id].dehydrate();
    }
    return dehydrated;
}
//# sourceMappingURL=graph.js.map