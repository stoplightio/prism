"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const diff_match_patch_1 = require("diff-match-patch");
const dom_1 = require("../../graph/dom");
const nodes_1 = require("../../graph/nodes");
const scheduler_1 = require("../../scheduler");
const differ = new diff_match_patch_1.diff_match_patch();
function createSerializeSourceNodeHandler(serialize) {
    return (node, { task, setSourceNodeProp, patchSourceNodeProp }) => {
        if (node.category !== nodes_1.NodeCategory.Source ||
            !node.data.parsed ||
            (task && task.trace && task.trace.sourceOp === scheduler_1.GraphTaskOp.DeserializeSourceNode)) {
            return;
        }
        const raw = serialize(node.data.parsed);
        if (node.data.raw === raw)
            return;
        if (node.data.raw &&
            node.data.diagnostics.every(({ source, code }) => source === 'spectral' || (typeof code === 'string' && scheduler_1.KNOWN_RESOLVER_ERRORS.includes(code)))) {
            patchSourceNodeProp(node.id, 'data.raw', diffText(node.data.raw, raw));
        }
        else {
            setSourceNodeProp(node.id, 'data.raw', raw);
        }
    };
}
exports.createSerializeSourceNodeHandler = createSerializeSourceNodeHandler;
function diffText(oldText, newText) {
    const diff = differ.diff_main(oldText, newText);
    differ.diff_cleanupEfficiency(diff);
    const patches = [];
    let offset = 0;
    for (const item of diff) {
        switch (item[0]) {
            case diff_match_patch_1.DIFF_INSERT:
                patches.push({
                    op: dom_1.JsonOp.Text,
                    length: 0,
                    offset,
                    value: item[1],
                });
                offset += item[1].length;
                break;
            case diff_match_patch_1.DIFF_DELETE:
                patches.push({
                    op: dom_1.JsonOp.Text,
                    length: item[1].length,
                    offset,
                    value: '',
                });
                break;
            case diff_match_patch_1.DIFF_EQUAL:
                offset += item[1].length;
                break;
        }
    }
    return patches;
}
exports.diffText = diffText;
//# sourceMappingURL=serializeSourceNode.js.map