"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nodes_1 = require("./graph/nodes");
function computeSourceMap(map, data, parentUri) {
    const uriMap = {};
    const nodeTree = [];
    switch (typeof data) {
        case 'object':
            for (const key in data) {
                if (!Object.prototype.hasOwnProperty.call(data, key)) {
                    continue;
                }
                const sanitizedKey = key.replace(/~/g, '~0').replace(/\//g, '~1');
                const match = findMapMatch(sanitizedKey, data[key], map);
                if (match) {
                    const uri = `${parentUri || ''}/${sanitizedKey}`;
                    const sourceMapNode = {
                        category: nodes_1.NodeCategory.SourceMap,
                        type: match.type,
                        path: sanitizedKey,
                    };
                    uriMap[uri] = sourceMapNode;
                    if (match.subtype)
                        sourceMapNode.subtype = match.subtype;
                    const node = Object.assign({}, uriMap[uri], { children: [] });
                    nodeTree.push(node);
                    if (match.children) {
                        node.children = computeSourceMap(match.children, data[key]).nodeTree;
                        Object.assign(uriMap, computeSourceMap(match.children, data[key], uri).uriMap);
                    }
                }
            }
            break;
    }
    return { uriMap, nodeTree };
}
exports.computeSourceMap = computeSourceMap;
function findMapMatch(key, value, map) {
    for (const entry of map) {
        let match = true;
        let target = key;
        if (entry.field) {
            target = value[entry.field];
        }
        if (entry.match) {
            match = target && typeof target === 'string' ? !!target.match(entry.match) : false;
        }
        else if (entry.notMatch) {
            match = target && typeof target === 'string' ? !!!target.match(entry.notMatch) : true;
        }
        if (match)
            return entry;
    }
}
//# sourceMappingURL=sourceMapper.js.map