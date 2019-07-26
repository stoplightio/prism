"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("@stoplight/path");
const treeify = require("treeify");
const types_1 = require("../nodes/types");
exports.printTree = (nodes, relative = true) => {
    return treeify.asTree(nodeTree(nodes, relative), false, false);
};
const createTreeNodeKey = ({ path, category, type, subtype, language }, relative) => {
    const normalizedSubtype = category === types_1.NodeCategory.SourceMap ? subtype : language;
    return `${formatPath(path, relative)} [${types_1.NodeCategory[category]}+${type}${normalizedSubtype ? `+${normalizedSubtype}` : ''}]`;
};
const nodeTree = (nodes, relative) => {
    const tree = {};
    nodes = Array.isArray(nodes) ? nodes : [nodes];
    for (const node of nodes) {
        const children = node.children;
        const incomingEdges = node.incomingEdges;
        const outgoingEdges = node.outgoingEdges;
        let subtree = {};
        if (children && children.length) {
            subtree = nodeTree(children, relative);
        }
        if (incomingEdges && incomingEdges.length) {
            subtree.incomingEdges = {};
            incomingEdges.forEach(edge => {
                subtree.incomingEdges[createTreeNodeKey(Object.assign({}, edge.source, { language: edge.source.language, path: edge.source.uri }), true)] = '';
            });
        }
        if (outgoingEdges && outgoingEdges.length) {
            subtree.outgoingEdges = {};
            outgoingEdges.forEach(edge => {
                subtree.outgoingEdges[createTreeNodeKey(Object.assign({}, edge.target, { language: edge.target.language, path: edge.target.uri }), true)] = '';
            });
        }
        tree[createTreeNodeKey(node, relative)] = Object.keys(subtree).length ? subtree : '';
    }
    return tree;
};
const formatPath = (path, relative) => {
    if (!relative || isRootPath(path) || !path_1.isAbsolute(path) || !require.main.filename)
        return path;
    return path.replace(path_1.normalize(path_1.dirname(require.main.filename)), '').replace(/^\//, '');
};
const isRootPath = (path) => {
    return path === path_1.sep;
};
//# sourceMappingURL=printTree.js.map