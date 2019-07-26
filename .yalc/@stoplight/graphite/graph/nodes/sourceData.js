"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const mobx_1 = require("mobx");
const filesystem_1 = require("../../backends/filesystem");
class SourceNodeData {
    constructor(props) {
        this.eol = filesystem_1.EOL.LF;
        this.diagnostics = [];
        if (props)
            Object.assign(this, props);
    }
    get raw() {
        if (this.isDirty) {
            return this._raw;
        }
        return this.original;
    }
    set raw(val) {
        this._raw = val === this.original ? undefined : val;
    }
    get original() {
        return this._original;
    }
    set original(val) {
        if (this._raw !== undefined && this._raw === val) {
            this._raw = undefined;
        }
        this._original = val;
    }
    get isDirty() {
        return this._raw !== undefined;
    }
    dehydrate() {
        return {
            raw: this.raw,
            parsed: this.parsed,
            diagnostics: this.diagnostics,
            isDirty: this.isDirty,
        };
    }
}
tslib_1.__decorate([
    mobx_1.observable,
    tslib_1.__metadata("design:type", Object)
], SourceNodeData.prototype, "_raw", void 0);
tslib_1.__decorate([
    mobx_1.observable,
    tslib_1.__metadata("design:type", Object)
], SourceNodeData.prototype, "_original", void 0);
tslib_1.__decorate([
    mobx_1.computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [Object])
], SourceNodeData.prototype, "raw", null);
tslib_1.__decorate([
    mobx_1.computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [Object])
], SourceNodeData.prototype, "original", null);
tslib_1.__decorate([
    mobx_1.computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], SourceNodeData.prototype, "isDirty", null);
tslib_1.__decorate([
    mobx_1.observable.ref,
    tslib_1.__metadata("design:type", Object)
], SourceNodeData.prototype, "parsed", void 0);
tslib_1.__decorate([
    mobx_1.observable.ref,
    tslib_1.__metadata("design:type", Object)
], SourceNodeData.prototype, "ast", void 0);
tslib_1.__decorate([
    mobx_1.observable.ref,
    tslib_1.__metadata("design:type", Object)
], SourceNodeData.prototype, "lineMap", void 0);
tslib_1.__decorate([
    mobx_1.observable.ref,
    tslib_1.__metadata("design:type", Object)
], SourceNodeData.prototype, "resolved", void 0);
tslib_1.__decorate([
    mobx_1.observable.ref,
    tslib_1.__metadata("design:type", Object)
], SourceNodeData.prototype, "refMap", void 0);
tslib_1.__decorate([
    mobx_1.observable.ref,
    tslib_1.__metadata("design:type", Array)
], SourceNodeData.prototype, "diagnostics", void 0);
exports.SourceNodeData = SourceNodeData;
//# sourceMappingURL=sourceData.js.map