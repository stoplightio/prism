"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const getLocationForJsonPath_1 = require("@stoplight/json/getLocationForJsonPath");
const types_1 = require("@stoplight/types");
const yaml_1 = require("@stoplight/yaml");
const lodash_1 = require("lodash");
const nodes_1 = require("../../graph/nodes");
const scheduler_1 = require("../../scheduler");
const getLocationForJsonPath = {
    yaml: yaml_1.getLocationForJsonPath,
    json: getLocationForJsonPath_1.getLocationForJsonPath,
};
const DEFAULT_RANGE = {
    start: {
        line: 0,
        character: 0,
    },
    end: {
        line: 0,
        character: 0,
    },
};
exports.KNOWN_RESOLVER_ERRORS = [
    'POINTER_MISSING',
    'RESOLVE_URI',
    'PARSE_URI',
    'RESOLVE_POINTER',
];
const prettyPrintResolverError = (message) => message.replace(/^Error\s*:\s*/, '');
const skipResolverErrors = (error) => typeof error.code !== 'string' ||
    (error.code !== 'invalid-ref' && !exports.KNOWN_RESOLVER_ERRORS.includes(error.code));
const formatResolverErrors = (errors, node) => {
    return lodash_1.uniqBy(errors, 'message').map(error => {
        const path = [...error.path, '$ref'];
        const location = node.language &&
            getLocationForJsonPath[node.language] &&
            getLocationForJsonPath[node.language]({
                data: node.data.parsed,
                ast: node.data.ast,
                lineMap: node.data.lineMap,
            }, path, true);
        const range = location ? location.range : DEFAULT_RANGE;
        return {
            code: error.code,
            path,
            message: prettyPrintResolverError(error.message),
            severity: types_1.DiagnosticSeverity.Error,
            range,
        };
    });
};
exports.resolveSourceNodeHandler = (node, { task, setSourceNodeProp, getNodeByUri, runTask, addEdge, removeEdge, resolver }) => tslib_1.__awaiter(this, void 0, void 0, function* () {
    if (node.category !== nodes_1.NodeCategory.Source) {
        return;
    }
    const tabu = task.tabu || [];
    if (!node.data.parsed) {
        return;
    }
    const { result, refMap, errors } = yield resolver.resolve(node.data.parsed, {
        baseUri: node.uri,
    });
    syncEdges(node, refMap, { getNodeByUri, addEdge, removeEdge });
    setSourceNodeProp(node.id, 'data.resolved', result);
    setSourceNodeProp(node.id, 'data.refMap', refMap);
    setSourceNodeProp(node.id, 'data.diagnostics', [
        ...node.data.diagnostics.filter(skipResolverErrors),
        ...formatResolverErrors(errors, node),
    ]);
    yield Promise.all(node.incomingEdges
        .filter(incomingEdge => incomingEdge.type === 1 && !tabu.includes(incomingEdge.source.id))
        .map(incomingEdge => runTask({
        op: scheduler_1.GraphTaskOp.ResolveSourceNode,
        nodeId: incomingEdge.source.id,
        tabu: [...tabu, node.id],
    })));
});
function syncEdges(sourceNode, refMap, { getNodeByUri, addEdge, removeEdge, }) {
    const targetNodeMap = Object.keys(refMap).reduce((map, sourceRef) => {
        const targetNode = getNodeByRef(refMap[sourceRef], { getNodeByUri });
        if (targetNode)
            map[targetNode.id] = targetNode;
        return map;
    }, {});
    sourceNode.outgoingEdges.filter(outgoingEdge => outgoingEdge.type === 1).forEach(outgoingEdge => {
        if (!(outgoingEdge.target.id in targetNodeMap)) {
            removeEdge(outgoingEdge.id);
        }
    });
    const outgoingEdgeTargetMap = sourceNode.outgoingEdges
        .filter(outgoingEdge => outgoingEdge.type === 1)
        .reduce((map, outgoingEdge) => {
        map[outgoingEdge.target.id] = outgoingEdge;
        return map;
    }, {});
    Object.keys(targetNodeMap).forEach(targetNodeId => {
        const targetNode = targetNodeMap[targetNodeId];
        if (!(targetNodeId in outgoingEdgeTargetMap)) {
            addEdge(sourceNode.id, targetNode.id, 1);
        }
    });
}
function getNodeByRef(ref, { getNodeByUri }) {
    if (typeof ref !== 'string' || ref.match(new RegExp('^(http:|https:)')))
        return;
    return getNodeByUri(decodeURI(ref.replace(new RegExp('^file://'), '').split('#')[0]));
}
//# sourceMappingURL=resolveSourceNode.js.map