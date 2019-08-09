"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
function translateToServers(spec, operation) {
    const schemes = operation.schemes || spec.schemes || [];
    const { host, basePath } = spec;
    if (!host) {
        return [];
    }
    return schemes.map(scheme => {
        let uri = utils_1.URI()
            .scheme(scheme)
            .host(host);
        if (basePath) {
            uri = uri.path(basePath);
        }
        return {
            url: uri.toString().replace(/\/$/, ''),
        };
    });
}
exports.translateToServers = translateToServers;
//# sourceMappingURL=servers.js.map