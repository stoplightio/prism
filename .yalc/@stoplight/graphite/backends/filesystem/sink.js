"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const eol = require('eol');
const path_1 = require("@stoplight/path");
const mm = require("micromatch");
const util_1 = require("util");
const nodes_1 = require("../../graph/nodes");
const taskHandler_1 = require("../../scheduler/taskHandler");
const types_1 = require("../../scheduler/types");
const types_2 = require("./types");
const utils_1 = require("./utils");
exports.createFileSystemBackend = (graphite, fs) => {
    return new FileSystemBackend(graphite, fs);
};
const defaultIgnore = ['**/*.un~', '**/node_modules', '**/.cache~', '**/.git', '**/dist/**'];
const neverRead = '**/*.{gif,png,jpg,jpeg,mp4,zip,tar}';
class FileSystemBackend {
    constructor(graphite, fs) {
        this.graphite = graphite;
        this.id = 'fs';
        this.handleReadDirectoryNode = (node, { addNode, reportError }) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const result = [];
            try {
                const items = yield this.fs.readdir(path_1.toFSPath(node.uri));
                if (!items)
                    return;
                const filteredItems = mm.not(items, defaultIgnore);
                for (const item of filteredItems) {
                    const absPath = path_1.resolve(node.uri, item);
                    const s = yield this.fs.stat(path_1.toFSPath(absPath));
                    if (s.isDirectory()) {
                        const dir = addNode({
                            category: nodes_1.NodeCategory.Source,
                            type: types_2.FilesystemNodeType.Directory,
                            path: item,
                            parentId: node.id,
                        });
                        result.push({
                            op: types_1.GraphTaskOp.ReadSourceNode,
                            nodeId: dir.id,
                        });
                    }
                    else {
                        const language = utils_1.filenameToLanguage(item);
                        const file = addNode({
                            category: nodes_1.NodeCategory.Source,
                            type: types_2.FilesystemNodeType.File,
                            language,
                            path: item,
                            parentId: node.id,
                        });
                        if ([nodes_1.Languages.Json, nodes_1.Languages.Yaml, nodes_1.Languages.Markdown].includes(language)) {
                            result.push({
                                op: types_1.GraphTaskOp.ReadSourceNode,
                                nodeId: file.id,
                            });
                        }
                    }
                }
            }
            catch (err) {
                err.message = err.message.replace(/\\/g, '/');
                reportError(node.id, err);
            }
            return result;
        });
        this.handleReadFileSourceNode = (node, { reportError, setSourceNodeProp }) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const result = [];
            try {
                if (!mm.isMatch(node.uri, neverRead)) {
                    const data = yield this.fs.readFile(path_1.toFSPath(node.uri), {
                        encoding: 'utf8',
                    });
                    const hasCLRF = /\r\n/.test(data);
                    setSourceNodeProp(node.id, 'data.original', eol.lf(data));
                    if (hasCLRF) {
                        setSourceNodeProp(node.id, 'data.eol', types_2.EOL.CRLF);
                    }
                }
            }
            catch (err) {
                err.message = err.message.replace(/\\/g, '/');
                reportError(node.id, err);
            }
            return result;
        });
        this.handleWriteFileSourceNode = (node, { reportError }) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                if (node.type === types_2.FilesystemNodeType.File && node.category === nodes_1.NodeCategory.Source) {
                    yield this.fs.writeFile(path_1.toFSPath(node.uri), node.data.eol === types_2.EOL.CRLF ? eol.crlf(node.data.raw || '') : node.data.raw || '', 'utf8');
                    if (node.data.isDirty) {
                        this.graphite.graph.setSourceNodeProp(node.id, 'data.original', node.data.raw);
                    }
                }
                else {
                    yield this.fs.mkdir(path_1.toFSPath(node.uri));
                }
            }
            catch (err) {
                err.message = err.message.replace(/\\/g, '/');
                reportError(node.id, err);
            }
        });
        this.handleRemoveSourceNode = (node, { reportError }) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                yield this.remove(node.id);
            }
            catch (err) {
                err.message = err.message.replace(/\\/g, '/');
                reportError(node.id, err);
            }
        });
        this.handleMoveSourceNode = (node, { reportError, moveNode, task }) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const moveOptions = task;
            try {
                const currentUri = node.uri;
                moveNode(node.id, moveOptions.newParentId, moveOptions.newPath, moveOptions.trace);
                yield this.fs.rename(path_1.toFSPath(currentUri), path_1.toFSPath(node.uri));
            }
            catch (err) {
                err.message = err.message.replace(/\\/g, '/');
                reportError(node.id, err);
            }
        });
        this.fs = {
            unlink: util_1.promisify(fs.unlink),
            rename: util_1.promisify(fs.rename),
            readdir: util_1.promisify(fs.readdir),
            stat: util_1.promisify(fs.stat),
            rmdir: util_1.promisify(fs.rmdir),
            readFile: util_1.promisify(fs.readFile),
            writeFile: util_1.promisify(fs.writeFile),
            mkdir: util_1.promisify(fs.mkdir),
        };
        graphite.scheduler.registerHandler(types_1.GraphTaskOp.ReadSourceNode, taskHandler_1.createTaskHandler({
            selector: node => node.type === types_2.FilesystemNodeType.Directory,
            run: this.handleReadDirectoryNode,
        }, 'file-read-directory'));
        graphite.scheduler.registerHandler(types_1.GraphTaskOp.ReadSourceNode, taskHandler_1.createTaskHandler({
            selector: node => node.type === types_2.FilesystemNodeType.File,
            run: this.handleReadFileSourceNode,
        }, 'file-read-node'));
        graphite.scheduler.registerHandler(types_1.GraphTaskOp.WriteSourceNode, taskHandler_1.createTaskHandler({
            selector: node => node.type === types_2.FilesystemNodeType.File || node.type === types_2.FilesystemNodeType.Directory,
            run: this.handleWriteFileSourceNode,
        }, 'file-write-node'));
        graphite.scheduler.registerHandler(types_1.GraphTaskOp.DeleteSourceNode, taskHandler_1.createTaskHandler({
            selector: node => node.type === types_2.FilesystemNodeType.File || node.type === types_2.FilesystemNodeType.Directory,
            run: this.handleRemoveSourceNode,
        }, 'file-remove-node'));
        graphite.scheduler.registerHandler(types_1.GraphTaskOp.MoveSourceNode, taskHandler_1.createTaskHandler({
            selector: node => node.type === types_2.FilesystemNodeType.File || node.type === types_2.FilesystemNodeType.Directory,
            run: this.handleMoveSourceNode,
        }, 'file-move-node'));
    }
    readdir(uri) {
        this.readNodeByUri(uri);
    }
    readFile(uri) {
        this.readNodeByUri(uri);
    }
    indexTree(uri, parentId) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const stat = yield this.fs.stat(path_1.toFSPath(uri));
            if (!stat)
                return;
            const path = path_1.basename(uri);
            let node = this.graphite.graph.getNodeByUri(uri);
            if (stat.isDirectory()) {
                if (!node) {
                    node = yield this.graphite.graph.addNode({
                        category: nodes_1.NodeCategory.Source,
                        type: types_2.FilesystemNodeType.Directory,
                        path: parentId ? path : uri,
                        parentId,
                    });
                }
                const children = yield this.fs.readdir(path_1.toFSPath(uri));
                if (!children)
                    return;
                for (const child of children) {
                    const childUri = `${uri}/${child}`;
                    if (mm.isMatch(childUri, defaultIgnore))
                        continue;
                    yield this.indexTree(childUri, node.id);
                }
            }
            else if (parentId) {
                node = yield this.graphite.graph.addNode({
                    category: nodes_1.NodeCategory.Source,
                    type: types_2.FilesystemNodeType.File,
                    path,
                    parentId,
                });
            }
        });
    }
    remove(id) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const node = this.graphite.graph.getNodeById(id);
            if (!node) {
                console.warn(`Node with id ${id} does not exist, cannot remove`);
                return;
            }
            try {
                if (node.type === types_2.FilesystemNodeType.Directory) {
                    yield this.deleteDirectoryRecursive(node.uri);
                }
                else if (node.type === types_2.FilesystemNodeType.File) {
                    yield this.fs.unlink(path_1.toFSPath(node.uri));
                }
                else {
                    console.warn(`I have no idea how to remove this ${id} node.`);
                    return;
                }
                this.graphite.graph.removeNode(node.id);
            }
            catch (err) {
                err.message = err.message.replace(/\\/g, '/');
                this.graphite.graph.reportError(node.id, err);
            }
        });
    }
    readNodeByUri(uri) {
        const node = this.graphite.graph.getNodeByUri(uri);
        if (!node) {
            console.warn(`Node with uri ${uri} does not exist, cannot readdir()`);
            return;
        }
        this.graphite.scheduler.queue({
            op: types_1.GraphTaskOp.ReadSourceNode,
            nodeId: node.id,
        });
    }
    deleteDirectoryRecursive(path) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const directoryContent = yield this.fs.readdir(path_1.toFSPath(path));
            for (const file of directoryContent) {
                const filePath = `${path}/${file}`;
                const fileStat = yield this.fs.stat(path_1.toFSPath(filePath));
                if (fileStat.isDirectory()) {
                    yield this.deleteDirectoryRecursive(filePath);
                }
                else {
                    yield this.fs.unlink(path_1.toFSPath(filePath));
                }
            }
            yield this.fs.rmdir(path_1.toFSPath(path));
        });
    }
}
exports.FileSystemBackend = FileSystemBackend;
//# sourceMappingURL=sink.js.map