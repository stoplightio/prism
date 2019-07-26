"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function computeNodeChildrenUriMap(node, filter) {
    const uriMap = {};
    for (const child of node.children) {
        if (!filter || filter(child)) {
            uriMap[child.uri] = child;
        }
        if (child.children && child.children.length) {
            Object.assign(uriMap, computeNodeChildrenUriMap(child, filter));
        }
    }
    return uriMap;
}
exports.computeNodeChildrenUriMap = computeNodeChildrenUriMap;
//# sourceMappingURL=nodes.js.map