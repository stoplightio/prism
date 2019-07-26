"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const mobx_1 = require("mobx");
const guards_1 = require("../utils/guards");
const paths_1 = require("../utils/paths");
const base_1 = require("./base");
const sourceMapData_1 = require("./sourceMapData");
const types_1 = require("./types");
class SourceMapNode extends base_1.BaseNode {
    constructor(props, parent) {
        super(props, parent);
        this.category = types_1.NodeCategory.SourceMap;
        this.data = new sourceMapData_1.SourceMapNodeData(this);
        this.subtype = props.subtype;
    }
    get parentId() {
        return this.parent.id;
    }
    get parentSourceNode() {
        return this.getAncestor(n => !!n && guards_1.isSourceNode(n));
    }
    get spec() {
        return this.parentSourceNode.spec;
    }
    get relativeJsonPath() {
        return paths_1.relativeJsonPath(this.parentSourceNode.uri, this.uri);
    }
    get language() {
        return this.parentSourceNode.language;
    }
    dehydrate() {
        return {
            id: this.id,
            category: this.category,
            type: this.type,
            subtype: this.subtype,
            path: this.path,
            uri: this.uri,
            parentId: this.parentId,
            spec: this.spec,
            language: this.language,
            parentSourceNodeId: this.parentSourceNode.id,
            relativeJsonPath: this.relativeJsonPath,
            data: this.data.dehydrate(),
        };
    }
}
tslib_1.__decorate([
    mobx_1.computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], SourceMapNode.prototype, "parentId", null);
tslib_1.__decorate([
    mobx_1.computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], SourceMapNode.prototype, "parentSourceNode", null);
tslib_1.__decorate([
    mobx_1.computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], SourceMapNode.prototype, "spec", null);
tslib_1.__decorate([
    mobx_1.computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], SourceMapNode.prototype, "relativeJsonPath", null);
tslib_1.__decorate([
    mobx_1.computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], SourceMapNode.prototype, "language", null);
exports.SourceMapNode = SourceMapNode;
//# sourceMappingURL=sourceMap.js.map