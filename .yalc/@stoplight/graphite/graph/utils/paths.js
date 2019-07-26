"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const json_1 = require("@stoplight/json");
function combinePathAndUri(path, uri) {
    if (uri === '/')
        return uri + path;
    return uri ? `${uri}/${path}` : `${path}`;
}
exports.combinePathAndUri = combinePathAndUri;
function relativeJsonPath(parentUri, uri) {
    if (!json_1.startsWith(uri, parentUri))
        throw new Error(`parentUri '${parentUri}' is not included in uri '${uri}'.`);
    let path = uri.replace(`${parentUri}`, '');
    path = path[0] === '/' ? path.slice(1) : path;
    const parts = json_1.pointerToPath(`#/${path}`);
    return parts[0] === '' ? parts.slice(1) : parts;
}
exports.relativeJsonPath = relativeJsonPath;
function getParentUri(uri) {
    if (uri === '/') {
        return;
    }
    const parentUri = uri
        .split('/')
        .slice(0, -1)
        .join('/');
    if (parentUri === '')
        return '/';
    return parentUri;
}
exports.getParentUri = getParentUri;
function encodeJsonPath(path) {
    return `/${path.map(json_1.encodePointerFragment).join('/')}`;
}
exports.encodeJsonPath = encodeJsonPath;
//# sourceMappingURL=paths.js.map