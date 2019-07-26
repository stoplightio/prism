"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nodes_1 = require("../nodes");
function isSourceNode(node) {
    return node.category === nodes_1.NodeCategory.Source;
}
exports.isSourceNode = isSourceNode;
function isVirtualNode(node) {
    return node.category === nodes_1.NodeCategory.Virtual;
}
exports.isVirtualNode = isVirtualNode;
function isRootNode(node) {
    return !isChild(node);
}
exports.isRootNode = isRootNode;
function isChild(node) {
    return node.parent ? true : false;
}
exports.isChild = isChild;
//# sourceMappingURL=guards.js.map