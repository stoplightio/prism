"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const securities_1 = require("./transformers/securities");
exports.transformOas2Service = ({ document }) => {
    const securitySchemes = lodash_1.values(document.securityDefinitions).map(sec => sec ? securities_1.translateToSingleSecurity(sec) : []);
    const security = lodash_1.compact(lodash_1.flatMap(document.security, sec => sec ? Object.keys(sec).map(n => securities_1.translateToSingleSecurity(lodash_1.get(document, ['securityDefinitions', n]))) : []));
    return Object.assign({ id: '?http-service-id?', name: lodash_1.get(document.info, 'title') || 'no-title' }, document.info, { servers: (document.schemes || ['https']).map(scheme => ({
            name: (document.info && document.info.title) || '',
            description: undefined,
            url: scheme + '://' + (document.host || '') + (document.basePath || ''),
        })), tags: lodash_1.compact(document.tags || []), security,
        securitySchemes });
};
//# sourceMappingURL=service.js.map