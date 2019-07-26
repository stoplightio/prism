"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DiffOp;
(function (DiffOp) {
    DiffOp["AddNode"] = "add_node";
    DiffOp["ModifyNode"] = "modify_node";
    DiffOp["RemoveNode"] = "remove_node";
    DiffOp["AddEdge"] = "add_edge";
    DiffOp["ModifyEdge"] = "modify_edge";
    DiffOp["RemoveEdge"] = "remove_edge";
})(DiffOp = exports.DiffOp || (exports.DiffOp = {}));
var GraphiteErrorCode;
(function (GraphiteErrorCode) {
    GraphiteErrorCode[GraphiteErrorCode["Plugin"] = 1] = "Plugin";
    GraphiteErrorCode[GraphiteErrorCode["Unhandled"] = 2] = "Unhandled";
    GraphiteErrorCode[GraphiteErrorCode["Generic"] = 3] = "Generic";
})(GraphiteErrorCode = exports.GraphiteErrorCode || (exports.GraphiteErrorCode = {}));
//# sourceMappingURL=types.js.map