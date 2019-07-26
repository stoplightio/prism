"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_spec_1 = require("@stoplight/http-spec");
const oas3_1 = require("../oas3");
const plugin_1 = require("./plugin");
function createOas3HttpPlugin() {
    return plugin_1.createOasHttpPlugin({
        version: 3,
        serviceSelector: oas3_1.oas3NodeSelector,
        operationSelector: oas3_1.oas3OperationSelector,
        transformService: http_spec_1.transformOas3Service,
        transformOperation: http_spec_1.transformOas3Operation,
    });
}
exports.createOas3HttpPlugin = createOas3HttpPlugin;
//# sourceMappingURL=oas3.js.map