"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("@stoplight/path");
const lodash_1 = require("lodash");
const types_1 = require("../../graph/nodes/types");
const extensionToLanguage = {
    md: types_1.Languages.Markdown,
    yml: types_1.Languages.Yaml,
    js: types_1.Languages.JavaScript,
    json: types_1.Languages.Json,
};
exports.languageMap = new Proxy(extensionToLanguage, {
    get(target, lang) {
        return lang in target ? target[lang] : lang;
    },
});
function filenameToLanguage(fileName) {
    return exports.languageMap[lodash_1.trimStart(path_1.extname(fileName), '.')];
}
exports.filenameToLanguage = filenameToLanguage;
//# sourceMappingURL=utils.js.map