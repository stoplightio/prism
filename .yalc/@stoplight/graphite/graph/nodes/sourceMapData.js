"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const json_1 = require("@stoplight/json");
const lodash_1 = require("lodash");
const mobx_1 = require("mobx");
class SourceMapNodeData {
    constructor(sourceMapNode) {
        this.sourceMapNode = sourceMapNode;
    }
    get parsed() {
        const sourceNode = this.sourceMapNode.parentSourceNode;
        if (!sourceNode || !sourceNode.data || !sourceNode.data.parsed)
            return;
        return lodash_1.get(sourceNode.data.parsed, this.sourceMapNode.relativeJsonPath);
    }
    get diagnostics() {
        const sourceMapNode = this.sourceMapNode;
        const sourceNode = sourceMapNode.parentSourceNode;
        if (!sourceNode || !sourceNode.data || !sourceNode.data.diagnostics)
            return [];
        return sourceNode.data.diagnostics
            .filter(diagnostic => {
            if (!diagnostic.path)
                return false;
            const diagUri = getFullDiagUri(sourceNode, diagnostic.path);
            if (sourceMapNode.uri === diagUri)
                return true;
            if (diagUri.indexOf(sourceMapNode.uri) === 0) {
                const restDiagPath = diagUri.substring(sourceMapNode.uri.length + 1).split('/');
                return !sourceMapNode.children.find(child => child.uri === sourceMapNode.uri + '/' + restDiagPath[0]);
            }
            return false;
        })
            .map(diagnostic => {
            return Object.assign({}, diagnostic, { path: getFullDiagUri(sourceNode, diagnostic.path)
                    .substring(sourceMapNode.uri.length + 1)
                    .split('/') });
        });
    }
    get resolved() {
        const sourceNode = this.sourceMapNode.parentSourceNode;
        if (!sourceNode || !sourceNode.data || !sourceNode.data.resolved)
            return;
        return lodash_1.get(sourceNode.data.resolved, this.sourceMapNode.relativeJsonPath);
    }
    dehydrate() {
        return {
            parsed: this.parsed,
            diagnostics: this.diagnostics,
        };
    }
}
tslib_1.__decorate([
    mobx_1.computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], SourceMapNodeData.prototype, "parsed", null);
tslib_1.__decorate([
    mobx_1.computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], SourceMapNodeData.prototype, "diagnostics", null);
tslib_1.__decorate([
    mobx_1.computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], SourceMapNodeData.prototype, "resolved", null);
exports.SourceMapNodeData = SourceMapNodeData;
function getFullDiagUri(sourceNode, diagnosticPath) {
    const diagPath = diagnosticPath.map(part => json_1.encodePointerFragment(String(part)));
    return `${sourceNode.uri}/${diagPath.join('/')}`;
}
//# sourceMappingURL=sourceMapData.js.map