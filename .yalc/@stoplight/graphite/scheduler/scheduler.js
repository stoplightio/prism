"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const json_ref_resolver_1 = require("@stoplight/json-ref-resolver");
const lifecycle_1 = require("@stoplight/lifecycle");
const yaml_1 = require("@stoplight/yaml");
const axios_1 = require("axios");
const immer_1 = require("immer");
const neo_async_1 = require("neo-async");
const errorReporter_1 = require("../errorReporter");
const nodes_1 = require("../graph/nodes");
const scheduler_1 = require("../scheduler");
const types_1 = require("../types");
function createScheduler(props) {
    return new Scheduler(props);
}
exports.createScheduler = createScheduler;
class Scheduler {
    constructor(props) {
        this._queued = {};
        this._handlers = handlerMap();
        this._running = {};
        this.queue = (task) => {
            if (!this._handlers[task.op].length)
                return Promise.resolve();
            const taskId = computeTaskId(task);
            let queued;
            if (taskId) {
                queued = this._queued[taskId];
            }
            if (!queued) {
                queued = new Promise((resolve, reject) => {
                    this._queue.push(task, priorityMap[task.op] || 99, err => {
                        if (taskId) {
                            delete this._queued[taskId];
                        }
                        if (err) {
                            errorReporter_1.errorReporter.reportError({
                                code: types_1.GraphiteErrorCode.Generic,
                                message: `Error running task ${task.op} ${err}`,
                                trace: task.trace,
                                nodeId: task.nodeId,
                            });
                            reject(err);
                        }
                        resolve();
                    });
                });
                if (taskId) {
                    this._queued[taskId] = queued;
                }
            }
            return queued;
        };
        this.queueAll = (tasks) => {
            return tasks.map(task => this.queue(task));
        };
        this.registerHandler = (op, handler) => {
            this._handlers[op].push(handler);
            return lifecycle_1.createDisposable(() => {
                const idx = this._handlers[op].indexOf(handler);
                if (idx >= 0) {
                    this._handlers[op].splice(idx, 1);
                }
            });
        };
        this.drain = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.drainQueue();
        });
        this._run = (task) => {
            const node = this._graph.getNodeById(task.nodeId);
            if (!node) {
                throw new Error(`Cannot find node with id ${task.nodeId} for task ${scheduler_1.GraphTaskOp[task.op]}.`);
            }
            const handler = findHandler(this._handlers[task.op], node);
            if (!handler)
                return;
            return handler.run(node, {
                task,
                getNodeById: this._graph.getNodeById,
                getNodeByUri: this._graph.getNodeByUri,
                getNodesByType: this._graph.getNodesByType,
                moveNode: this._graph.moveNode,
                applyPatch: patch => {
                    return this._graph.applyPatch({
                        operations: patch.operations,
                        trace: Object.assign({}, patch.trace, { sourceOp: task.op }),
                    });
                },
                removeNode: (id, trace = {}) => {
                    return this._graph.removeNode(id, Object.assign({}, trace, { sourceOp: task.op }));
                },
                addNode: (props, trace = {}) => {
                    return this._graph.addNode(props, Object.assign({}, trace, { sourceOp: task.op }));
                },
                addEdge: (source, target, data, trace = {}) => {
                    return this._graph.addEdge(source, target, data, Object.assign({}, trace, { sourceOp: task.op }));
                },
                removeEdge: (id, trace = {}) => {
                    return this._graph.removeEdge(id, Object.assign({}, trace, { sourceOp: task.op }));
                },
                setSourceNodeProp: (id, prop, value, trace = {}) => {
                    return this._graph.setSourceNodeProp(id, prop, value, Object.assign({}, trace, { sourceOp: task.op }));
                },
                patchSourceNodeProp: (id, prop, parsed, trace = {}) => {
                    return this._graph.patchSourceNodeProp(id, prop, parsed, Object.assign({}, trace, { sourceOp: task.op }));
                },
                reportError: (nodeId, error, trace = {}) => {
                    return this._graph.reportError(nodeId, error, immer_1.default(trace, source => {
                        source.sourceOp = task.op;
                    }));
                },
                setSourceNodeDiagnostics: (id, diagnostics, trace = {}) => {
                    return this._graph.setSourceNodeDiagnostics(id, handler.id, diagnostics, Object.assign({}, trace, { sourceOp: task.op }));
                },
                runTask: (t) => {
                    return this.run(t);
                },
                resolver: this._resolver,
            });
        };
        this.drainQueue = () => {
            return new Promise((resolve, reject) => {
                if (this.queueLength()) {
                    this._queue.drain = resolve;
                    this._queue.error = reject;
                }
                else {
                    resolve();
                }
            });
        };
        this._runQueueTask = (task, cb) => {
            const taskId = computeTaskId(task);
            this._running[taskId] = true;
            try {
                const result = this._run(task);
                if (result instanceof Promise) {
                    result
                        .then(r => {
                        this._handleRunResult(r);
                        delete this._running[taskId];
                        cb();
                    })
                        .catch(cb)
                        .then(() => delete this._running[taskId]);
                }
                else {
                    this._handleRunResult(result);
                    delete this._running[taskId];
                    setTimeout(cb, 0);
                }
            }
            catch (e) {
                delete this._running[taskId];
                cb(e);
            }
        };
        this._handleRunResult = (result) => {
            if (result) {
                this.queueAll(result);
            }
        };
        this._graph = props.graph;
        this._queue = neo_async_1.priorityQueue(this._runQueueTask, 1);
        this._resolver = createResolver(new ResolveCache(), this._graph.getNodeByUri);
    }
    queueLength() {
        return this._queue.length();
    }
    run(task) {
        const taskId = computeTaskId(task);
        const queued = this._queued[taskId];
        if (queued && this._running[taskId]) {
            return queued;
        }
        this._queue.remove((t) => taskId === computeTaskId(t));
        const taskPromise = new Promise((resolve, reject) => this._runQueueTask(task, err => {
            if (taskId) {
                delete this._queued[taskId];
            }
            if (err) {
                console.error(`Error running task ${task.op}`, err);
                reject(err);
            }
            resolve();
        }));
        this._queued[taskId] = taskPromise;
        return taskPromise;
    }
}
function computeTaskId(task) {
    return `${task.op}:${task.nodeId}`;
}
const priorityMap = {
    [scheduler_1.GraphTaskOp.SerializeSourceNode]: 1,
    [scheduler_1.GraphTaskOp.DeserializeSourceNode]: 1,
    [scheduler_1.GraphTaskOp.DiffRawToParsed]: 1,
    [scheduler_1.GraphTaskOp.ComputeSourceMap]: 2,
    [scheduler_1.GraphTaskOp.ReadSourceNode]: 3,
    [scheduler_1.GraphTaskOp.WriteSourceNode]: 3,
    [scheduler_1.GraphTaskOp.DeleteSourceNode]: 3,
    [scheduler_1.GraphTaskOp.MoveSourceNode]: 3,
    [scheduler_1.GraphTaskOp.ValidateSourceNode]: 4,
    [scheduler_1.GraphTaskOp.ResolveSourceNode]: 5,
    [scheduler_1.GraphTaskOp.TransformParsed]: 6,
};
const handlerMap = () => ({
    [scheduler_1.GraphTaskOp.SerializeSourceNode]: [],
    [scheduler_1.GraphTaskOp.DeserializeSourceNode]: [],
    [scheduler_1.GraphTaskOp.DiffRawToParsed]: [],
    [scheduler_1.GraphTaskOp.ComputeSourceMap]: [],
    [scheduler_1.GraphTaskOp.ReadSourceNode]: [],
    [scheduler_1.GraphTaskOp.WriteSourceNode]: [],
    [scheduler_1.GraphTaskOp.DeleteSourceNode]: [],
    [scheduler_1.GraphTaskOp.TransformParsed]: [],
    [scheduler_1.GraphTaskOp.MoveSourceNode]: [],
    [scheduler_1.GraphTaskOp.ResolveSourceNode]: [],
    [scheduler_1.GraphTaskOp.ValidateSourceNode]: [],
});
const findHandler = (handlers, node) => {
    return handlers.find(h => h.selector(node));
};
const createResolver = (uriCache, getNodeByUri) => {
    const httpReader = {
        resolve: (uri) => tslib_1.__awaiter(this, void 0, void 0, function* () { return (yield axios_1.default({ url: uri.toString() })).data; }),
    };
    const fileReader = {
        resolve: (uri) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const path = decodeURI(uri.valueOf());
            const referredNode = getNodeByUri(path);
            if (!referredNode) {
                throw new Error(`Target $ref not found: ${String(uri)}`);
            }
            if (referredNode.category === nodes_1.NodeCategory.Virtual) {
                throw new Error(`Resolving virtual nodes is not supported. Node Id = ${referredNode.id}`);
            }
            return referredNode.data.parsed;
        }),
    };
    return new json_ref_resolver_1.Resolver({
        uriCache,
        resolvers: {
            http: httpReader,
            https: httpReader,
            file: fileReader,
        },
        parseResolveResult: (opts) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (typeof opts.result === 'string') {
                try {
                    opts.result = yaml_1.parse(opts.result);
                }
                catch (e) {
                }
            }
            return opts;
        }),
    });
};
class ResolveCache extends json_ref_resolver_1.Cache {
    set(key, value) {
        if (key.indexOf('http') === 0) {
            super.set(key, value);
        }
    }
}
//# sourceMappingURL=scheduler.js.map