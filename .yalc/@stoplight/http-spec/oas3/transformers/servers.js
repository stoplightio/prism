"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
function translateToServers(servers) {
    return lodash_1.map(servers, server => ({
        description: server.description,
        url: server.url,
        variables: lodash_1.mapValues(server.variables, (value) => ({
            default: String(value.default),
            description: String(value.default),
            enum: lodash_1.map(value.enum, String),
        })),
    }));
}
exports.translateToServers = translateToServers;
//# sourceMappingURL=servers.js.map