"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_spec_1 = require("@stoplight/http-spec");
const oas2_1 = require("../oas2");
const plugin_1 = require("./plugin");
function createOas2HttpPlugin() {
    return plugin_1.createOasHttpPlugin({
        version: 2,
        serviceSelector: oas2_1.oas2NodeSelector,
        operationSelector: oas2_1.oas2OperationSelector,
        transformService: http_spec_1.transformOas2Service,
        transformOperation: http_spec_1.transformOas2Operation,
    });
}
exports.createOas2HttpPlugin = createOas2HttpPlugin;
//# sourceMappingURL=oas2.js.map