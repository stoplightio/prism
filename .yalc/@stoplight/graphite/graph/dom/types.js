"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var GraphOp;
(function (GraphOp) {
    GraphOp[GraphOp["AddNode"] = 1] = "AddNode";
    GraphOp[GraphOp["MoveNode"] = 2] = "MoveNode";
    GraphOp[GraphOp["RemoveNode"] = 3] = "RemoveNode";
    GraphOp[GraphOp["SetSourceNodeDiagnostics"] = 4] = "SetSourceNodeDiagnostics";
    GraphOp[GraphOp["SetSourceNodeProp"] = 5] = "SetSourceNodeProp";
    GraphOp[GraphOp["PatchSourceNodeProp"] = 6] = "PatchSourceNodeProp";
    GraphOp[GraphOp["AddEdge"] = 7] = "AddEdge";
    GraphOp[GraphOp["RemoveEdge"] = 8] = "RemoveEdge";
    GraphOp[GraphOp["PatchEdgeData"] = 9] = "PatchEdgeData";
})(GraphOp = exports.GraphOp || (exports.GraphOp = {}));
var JsonOp;
(function (JsonOp) {
    JsonOp["Add"] = "add";
    JsonOp["Remove"] = "remove";
    JsonOp["Replace"] = "replace";
    JsonOp["Move"] = "move";
    JsonOp["Copy"] = "copy";
    JsonOp["Test"] = "test";
    JsonOp["Text"] = "text";
})(JsonOp = exports.JsonOp || (exports.JsonOp = {}));
//# sourceMappingURL=types.js.map