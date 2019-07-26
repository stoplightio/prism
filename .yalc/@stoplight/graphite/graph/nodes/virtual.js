"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const mobx_1 = require("mobx");
const base_1 = require("./base");
const types_1 = require("./types");
class VirtualNode extends base_1.BaseNode {
    constructor(props, parent) {
        super(props, parent);
        this.category = types_1.NodeCategory.Virtual;
        this.data = (props.data || {});
    }
    get parentId() {
        return this.parent.id;
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
            data: this.data,
        };
    }
}
tslib_1.__decorate([
    mobx_1.observable.ref,
    tslib_1.__metadata("design:type", Object)
], VirtualNode.prototype, "data", void 0);
tslib_1.__decorate([
    mobx_1.computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], VirtualNode.prototype, "parentId", null);
exports.VirtualNode = VirtualNode;
//# sourceMappingURL=virtual.js.map