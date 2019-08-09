"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const securities_1 = require("./transformers/securities");
exports.transformOas3Service = ({ document }) => {
    const servers = lodash_1.compact((document.servers || []).map(server => server
        ? {
            name: lodash_1.get(document.info, 'title'),
            description: server.description,
            url: server.url,
        }
        : null));
    const security = lodash_1.compact(lodash_1.flatMap(document.security || [], sec => sec
        ? lodash_1.compact(Object.keys(sec).map(n => n ? securities_1.transformToSingleSecurity(lodash_1.get(document, ['components', 'securitySchemes', n])) : null))
        : null));
    const securitySchemes = lodash_1.compact(Object.values((document.components && document.components.securitySchemes) || [])
        .filter(scheme => typeof scheme === 'object')
        .map(sec => (sec ? securities_1.transformToSingleSecurity(sec) : undefined)));
    return Object.assign({ id: '?http-service-id?', name: lodash_1.get(document.info, 'title') || 'no-title' }, document.info, { servers, tags: lodash_1.compact(document.tags || []), security,
        securitySchemes });
};
//# sourceMappingURL=service.js.map