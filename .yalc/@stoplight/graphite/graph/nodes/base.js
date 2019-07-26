"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const lifecycle_1 = require("@stoplight/lifecycle");
const path_1 = require("@stoplight/path");
const lodash_1 = require("lodash");
const mobx_1 = require("mobx");
const paths_1 = require("../utils/paths");
class BaseNode {
    constructor(props, parent) {
        this.disposables = new lifecycle_1.DisposableCollection();
        this.children = [];
        this.incomingEdges = [];
        this.outgoingEdges = [];
        BaseNode.assertPath(parent, props.path);
        this.id = props.id;
        this.type = props.type;
        this._language = props.language;
        this._path = props.path;
        this.parent = parent;
        this._parent = parent;
    }
    static assertPath(parent, path) {
        if (!parent && !path_1.isAbsolute(path)) {
            throw new Error('Top-level nodes must have absolute paths');
        }
    }
    get language() {
        return this._language;
    }
    set language(value) {
        this._language = value;
    }
    get path() {
        return this._path;
    }
    set path(path) {
        BaseNode.assertPath(this.parent, path);
        this._path = path;
    }
    get parent() {
        return this._parent;
    }
    set parent(parent) {
        if (parent === this.parent)
            return;
        BaseNode.assertPath(parent, this.path);
        if (this.parent) {
            lodash_1.pull(this.parent.children, this);
        }
        this._parent = parent;
        if (parent) {
            parent.children.push(this);
        }
    }
    get parentId() {
        return this.parent ? this.parent.id : undefined;
    }
    get uri() {
        return paths_1.combinePathAndUri(this.path, this.parent ? this.parent.uri : '');
    }
    get version() {
        let version = '0.0';
        const match = this.uri.match(/\.v\d+(-\d+)?(-[0-9A-Za-z-]+)?\./);
        if (match && match.length > 0) {
            const dashedVersion = match[0].replace(/^\.v|\.$/g, '');
            version = dashedVersion.replace(/-/g, '.');
        }
        return version;
    }
    getAncestor(matcher) {
        const parentNode = this.parent;
        if (!parentNode)
            return;
        if (matcher(parentNode)) {
            return parentNode;
        }
        return parentNode.getAncestor(matcher);
    }
    removeEdges() {
        this.incomingEdges.forEach((edge) => edge.dispose());
        this.outgoingEdges.forEach((edge) => edge.dispose());
    }
    dispose() {
        this.disposables.dispose();
        this.removeEdges();
    }
}
tslib_1.__decorate([
    mobx_1.observable,
    tslib_1.__metadata("design:type", String)
], BaseNode.prototype, "_path", void 0);
tslib_1.__decorate([
    mobx_1.observable.shallow,
    tslib_1.__metadata("design:type", Array)
], BaseNode.prototype, "children", void 0);
tslib_1.__decorate([
    mobx_1.observable.shallow,
    tslib_1.__metadata("design:type", Object)
], BaseNode.prototype, "incomingEdges", void 0);
tslib_1.__decorate([
    mobx_1.observable.shallow,
    tslib_1.__metadata("design:type", Object)
], BaseNode.prototype, "outgoingEdges", void 0);
tslib_1.__decorate([
    mobx_1.observable.ref,
    tslib_1.__metadata("design:type", Object)
], BaseNode.prototype, "_parent", void 0);
tslib_1.__decorate([
    mobx_1.computed,
    tslib_1.__metadata("design:type", String),
    tslib_1.__metadata("design:paramtypes", [String])
], BaseNode.prototype, "path", null);
tslib_1.__decorate([
    mobx_1.computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [Object])
], BaseNode.prototype, "parent", null);
tslib_1.__decorate([
    mobx_1.computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], BaseNode.prototype, "parentId", null);
tslib_1.__decorate([
    mobx_1.computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], BaseNode.prototype, "uri", null);
tslib_1.__decorate([
    mobx_1.computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], BaseNode.prototype, "version", null);
exports.BaseNode = BaseNode;
//# sourceMappingURL=base.js.map