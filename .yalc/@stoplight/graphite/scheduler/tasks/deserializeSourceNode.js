"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const json_1 = require("@stoplight/json");
const jiff_1 = require("jiff");
const lodash_1 = require("lodash");
const dom_1 = require("../../graph/dom");
const nodes_1 = require("../../graph/nodes");
const scheduler_1 = require("../../scheduler");
function createDeserializeSourceNodeHandler(deserialize) {
    return (node, { task, setSourceNodeProp, patchSourceNodeProp, reportError, setSourceNodeDiagnostics }) => {
        if (node.category !== nodes_1.NodeCategory.Source ||
            !node.data.raw ||
            (task && task.trace && task.trace.sourceOp === scheduler_1.GraphTaskOp.SerializeSourceNode)) {
            return;
        }
        let newParsed;
        try {
            newParsed = deserialize(node.data.raw);
        }
        catch (error) {
            reportError(node.id, error, task && task.trace);
        }
        if (!newParsed)
            return;
        if (!newParsed.diagnostics.length) {
            if (!node.data.parsed || lodash_1.isEmpty(node.data.parsed)) {
                setSourceNodeProp(node.id, 'data.parsed', newParsed.data);
            }
            else {
                let patch = jiff_1.diff(node.data.parsed, newParsed.data, {
                    invertible: false,
                }).map((item) => {
                    return Object.assign({}, item, (item.path !== undefined && {
                        path: item.path
                            .split('/')
                            .slice(1)
                            .map(json_1.decodePointerFragment),
                    }));
                });
                patch = identifyMoveOperations(patch, node);
                if (!task.recomputeOnly) {
                    patchSourceNodeProp(node.id, 'data.parsed', patch);
                }
            }
        }
        setSourceNodeProp(node.id, 'data.lineMap', newParsed.lineMap);
        setSourceNodeProp(node.id, 'data.ast', newParsed.ast);
        setSourceNodeDiagnostics(node.id, newParsed.diagnostics);
    };
}
exports.createDeserializeSourceNodeHandler = createDeserializeSourceNodeHandler;
function identifyMoveOperations(patch, node) {
    const removes = patch.filter(o => o.op === dom_1.JsonOp.Remove);
    const adds = patch.filter(o => o.op === dom_1.JsonOp.Add);
    if (removes.length !== 1 || adds.length !== 1)
        return patch;
    for (const remove of removes) {
        for (const add of adds) {
            const parsed = lodash_1.get(node, 'data.parsed');
            if (parsed && lodash_1.isEqual(lodash_1.get(parsed, remove.path), add.value)) {
                return [
                    {
                        op: dom_1.JsonOp.Move,
                        from: remove.path,
                        path: add.path,
                    },
                ];
            }
        }
    }
    return patch;
}
exports.identifyMoveOperations = identifyMoveOperations;
//# sourceMappingURL=deserializeSourceNode.js.map