"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const mobx_1 = require("mobx");
const base_1 = require("./base");
const sourceData_1 = require("./sourceData");
const types_1 = require("./types");
class SourceNode extends base_1.BaseNode {
    constructor(props, parent) {
        super(props, parent);
        this.category = types_1.NodeCategory.Source;
        this.data = new sourceData_1.SourceNodeData();
        if (props.data) {
            this.data = new sourceData_1.SourceNodeData(props.data);
        }
    }
    get spec() {
        return this._spec;
    }
    set spec(value) {
        this._spec = value;
    }
    dehydrate() {
        return {
            id: this.id,
            category: this.category,
            type: this.type,
            language: this.language,
            path: this.path,
            uri: this.uri,
            parentId: this.parentId,
            data: this.data.dehydrate(),
            spec: this.spec,
        };
    }
}
tslib_1.__decorate([
    mobx_1.observable,
    tslib_1.__metadata("design:type", String)
], SourceNode.prototype, "_spec", void 0);
tslib_1.__decorate([
    mobx_1.computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [Object])
], SourceNode.prototype, "spec", null);
tslib_1.__decorate([
    mobx_1.observable.ref,
    tslib_1.__metadata("design:type", Object)
], SourceNode.prototype, "data", void 0);
exports.SourceNode = SourceNode;
//# sourceMappingURL=source.js.map