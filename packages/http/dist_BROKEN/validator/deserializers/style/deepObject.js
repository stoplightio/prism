"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deserializeDeepObjectStyle = void 0;
function deserializeDeepObjectStyle(name, parameters, schema) {
    function resolve(path) {
        return name + path.map(el => `[${el}]`).join('');
    }
    function constructArray(currentPath, items) {
        const path = resolve(currentPath).replace(/\[/g, '\\[').replace(/\]/g, '\\]');
        const regexp = new RegExp(`^${path}\\[([0-9]+)\\]`);
        const indexes = Object.keys(parameters).reduce((list, k) => {
            const matches = regexp.exec(k);
            if (!matches) {
                return list;
            }
            return { ...list, [matches[1]]: null };
        }, {});
        return Object.keys(indexes).map(i => construct([...currentPath, String(i)], items));
    }
    function constructObject(currentPath, props) {
        return Object.keys(props).reduce((result, k) => ({ ...result, [k]: construct([...currentPath, k], props[k]) }), {});
    }
    function construct(currentPath, def) {
        if (def.type === 'object') {
            return constructObject(currentPath, def.properties || {});
        }
        if (def.type === 'array') {
            return constructArray(currentPath, def.items || {});
        }
        return parameters[resolve(currentPath)];
    }
    return construct([], schema);
}
exports.deserializeDeepObjectStyle = deserializeDeepObjectStyle;
