"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const URIJS = require("urijs");
const json_1 = require("@stoplight/json");
function uniqFlatMap(collection) {
    return lodash_1.uniq(lodash_1.flatten(lodash_1.map(collection, Object.keys)));
}
exports.uniqFlatMap = uniqFlatMap;
function URI(url = '') {
    const uri = !url || typeof url === 'string' ? new URIJS(url) : url;
    return {
        scheme: (type = '') => URI(uri.scheme(type)),
        host: (host = '') => URI(uri.host(typeof host === 'string' && Number.isNaN(Number(host.split(':')[1])) ? URIJS.encode(host) : host)),
        port: (port = '') => URI(uri.port(Number.isNaN(Number(port)) ? '' : port)),
        path: (path = '') => URI(uri.path(path)),
        pointer: (pathOrPointer) => URI(uri.hash(Array.isArray(pathOrPointer) ? json_1.pathToPointer(pathOrPointer) : pathOrPointer)),
        toString: () => URIJS.decode(uri.normalize().valueOf()),
        append: (path = '') => {
            const uri2 = new URIJS(path);
            if (uri.fragment()) {
                if (uri2.fragment()) {
                    return URI(uri.fragment(uri2.fragment()));
                }
                else {
                    return URI(uri.hash(json_1.pathToPointer([...json_1.pointerToPath(uri.hash()), path])));
                }
            }
            else {
                if (uri2.fragment()) {
                    return URI(uri.fragment(json_1.pathToPointer([path.split('#/')[1]])));
                }
                else {
                    return URI(uri.segment([...uri.segment(), path]));
                }
            }
        },
    };
}
exports.URI = URI;
//# sourceMappingURL=utils.js.map