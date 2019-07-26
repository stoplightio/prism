"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var GraphiteEvent;
(function (GraphiteEvent) {
    GraphiteEvent[GraphiteEvent["DidPatch"] = 1] = "DidPatch";
    GraphiteEvent[GraphiteEvent["DidAddNode"] = 2] = "DidAddNode";
    GraphiteEvent[GraphiteEvent["DidMoveNode"] = 3] = "DidMoveNode";
    GraphiteEvent[GraphiteEvent["DidRemoveNode"] = 4] = "DidRemoveNode";
    GraphiteEvent[GraphiteEvent["DidChangeSourceNode"] = 5] = "DidChangeSourceNode";
    GraphiteEvent[GraphiteEvent["DidSetSourceNodeProp"] = 6] = "DidSetSourceNodeProp";
    GraphiteEvent[GraphiteEvent["DidPatchSourceNodeProp"] = 7] = "DidPatchSourceNodeProp";
    GraphiteEvent[GraphiteEvent["DidUpdateNodeUri"] = 8] = "DidUpdateNodeUri";
    GraphiteEvent[GraphiteEvent["DidUpdateSourceMapNodeData"] = 9] = "DidUpdateSourceMapNodeData";
    GraphiteEvent[GraphiteEvent["DidUpdateSourceMapNodeResolved"] = 10] = "DidUpdateSourceMapNodeResolved";
    GraphiteEvent[GraphiteEvent["DidAddEdge"] = 11] = "DidAddEdge";
    GraphiteEvent[GraphiteEvent["DidRemoveEdge"] = 12] = "DidRemoveEdge";
    GraphiteEvent[GraphiteEvent["DidPatchEdgeData"] = 13] = "DidPatchEdgeData";
    GraphiteEvent[GraphiteEvent["DidError"] = 14] = "DidError";
    GraphiteEvent[GraphiteEvent["DidPatchSourceNodePropComplete"] = 15] = "DidPatchSourceNodePropComplete";
})(GraphiteEvent = exports.GraphiteEvent || (exports.GraphiteEvent = {}));
//# sourceMappingURL=types.js.map