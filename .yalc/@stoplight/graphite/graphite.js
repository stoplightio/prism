"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lifecycle_1 = require("@stoplight/lifecycle");
const uuidv4 = require("uuid/v4");
const errorReporter_1 = require("./errorReporter");
const graph_1 = require("./graph");
const dom_1 = require("./graph/dom");
const nodes_1 = require("./graph/nodes");
const notifier_1 = require("./notifier");
const scheduler_1 = require("./scheduler");
const taskHandler_1 = require("./scheduler/taskHandler");
const specProviderRegistry_1 = require("./services/specProviderRegistry");
function createGraphite(props = {}) {
    return new Graphite(props);
}
exports.createGraphite = createGraphite;
class Graphite {
    constructor(props) {
        this._disposables = new lifecycle_1.DisposableCollection();
        this.dispose = () => {
            this._disposables.dispose();
        };
        this.id = props.id || uuidv4();
        this.notifier = (props.graph && props.graph.notifier) || props.notifier || notifier_1.createNotifier();
        this.graph =
            props.graph ||
                graph_1.createGraph({
                    id: this.id,
                    idGenerator: props.idGenerator,
                    notifier: this.notifier,
                });
        this.scheduler =
            props.scheduler ||
                scheduler_1.createScheduler({
                    graph: this.graph,
                });
        this._disposables.pushAll([this.graph, this.notifier]);
        this._disposables.pushAll(this.scheduleSerialize());
        this._disposables.pushAll(this.scheduleDeserialize());
        this._disposables.pushAll(this.scheduleComputeSourceMap());
        this._disposables.pushAll(this.scheduleTransformations());
        if (!props.isMirror) {
            this._disposables.pushAll(this.scheduleValidateSourceNode());
            this._disposables.pushAll(this.scheduleResolveSourceNode());
        }
        const sourceNodeDataHandler = (op) => {
            const node = this.graph.getNodeById(op.id);
            if (!node) {
                console.debug(`${dom_1.GraphOp[op.op]} node with id ${op.id} not found.`);
                return;
            }
            this.notifier.emit(notifier_1.GraphiteEvent.DidChangeSourceNode, {
                node: node.dehydrate(),
                change: op,
            });
        };
        this._disposables.pushAll([
            this.notifier.on(notifier_1.GraphiteEvent.DidSetSourceNodeProp, sourceNodeDataHandler),
            this.notifier.on(notifier_1.GraphiteEvent.DidPatchSourceNodeProp, sourceNodeDataHandler),
        ]);
        this._disposables.push(errorReporter_1.errorReporter.onError(result => {
            this.notifier.emit(notifier_1.GraphiteEvent.DidError, result);
        }));
    }
    registerPlugins(...plugins) {
        const disposables = new lifecycle_1.DisposableCollection();
        plugins.forEach(plugin => {
            plugin.tasks.forEach(task => {
                disposables.push(this.scheduler.registerHandler(task.operation, task.handler));
            });
            if (plugin.specProvider) {
                disposables.push(specProviderRegistry_1.registry.register(plugin.specProvider));
            }
        });
        return disposables;
    }
    scheduleTransformations() {
        return [
            this.notifier.on(notifier_1.GraphiteEvent.DidSetSourceNodeProp, ({ id, prop, trace = {}, previousValue }) => {
                if (prop === 'spec') {
                    this.scheduler.queue({
                        op: scheduler_1.GraphTaskOp.TransformParsed,
                        nodeId: id,
                        trace,
                    });
                }
                else if (prop === 'data.resolved') {
                    this.scheduler.queue({
                        op: scheduler_1.GraphTaskOp.TransformParsed,
                        nodeId: id,
                        trace,
                        oldValue: previousValue,
                    });
                }
            }),
            this.notifier.on(notifier_1.GraphiteEvent.DidUpdateSourceMapNodeResolved, ({ id, oldValue, trace }) => {
                this.scheduler.queue({
                    op: scheduler_1.GraphTaskOp.TransformParsed,
                    nodeId: id,
                    trace,
                    oldValue,
                });
            }),
        ];
    }
    scheduleDeserialize() {
        const handler = (op) => {
            const { id, prop, trace = {} } = op;
            if (prop !== 'data.raw' && prop !== 'data.original' && prop !== 'data.parsed')
                return;
            this.scheduler
                .queue({
                op: scheduler_1.GraphTaskOp.DeserializeSourceNode,
                nodeId: id,
                trace,
                recomputeOnly: prop === 'data.parsed',
            })
                .then(() => {
                this.notifier.emit(notifier_1.GraphiteEvent.DidPatchSourceNodePropComplete, op);
            });
        };
        return [
            this.notifier.on(notifier_1.GraphiteEvent.DidAddNode, ({ node, trace = {} }) => {
                if (node.category !== nodes_1.NodeCategory.Source)
                    return;
                this.scheduler.queue({
                    op: scheduler_1.GraphTaskOp.DeserializeSourceNode,
                    nodeId: node.id,
                    trace,
                });
            }),
            this.notifier.on(notifier_1.GraphiteEvent.DidPatchSourceNodeProp, handler),
            this.notifier.on(notifier_1.GraphiteEvent.DidSetSourceNodeProp, handler),
        ];
    }
    scheduleSerialize() {
        const handler = ({ id, prop, trace = {} }) => {
            if (prop !== 'data.parsed')
                return;
            this.scheduler.queue({
                op: scheduler_1.GraphTaskOp.SerializeSourceNode,
                nodeId: id,
                trace,
            });
        };
        return [
            this.notifier.on(notifier_1.GraphiteEvent.DidPatchSourceNodeProp, handler),
            this.notifier.on(notifier_1.GraphiteEvent.DidSetSourceNodeProp, handler),
        ];
    }
    scheduleComputeSourceMap() {
        return [
            this.notifier.on(notifier_1.GraphiteEvent.DidPatchSourceNodeProp, ({ id, prop, trace = {}, value }) => {
                if (prop !== 'data.parsed')
                    return;
                this.scheduler.queue({
                    op: scheduler_1.GraphTaskOp.ComputeSourceMap,
                    nodeId: id,
                    patch: value,
                    trace,
                });
            }),
            this.notifier.on(notifier_1.GraphiteEvent.DidSetSourceNodeProp, ({ id, prop, trace = {}, value }) => {
                if (prop !== 'data.parsed')
                    return;
                this.scheduler.queue({
                    op: scheduler_1.GraphTaskOp.ComputeSourceMap,
                    nodeId: id,
                    trace,
                });
            }),
            this.notifier.on(notifier_1.GraphiteEvent.DidAddNode, ({ node, trace }) => {
                if (node.category !== nodes_1.NodeCategory.Source || !node.data || !node.data.parsed)
                    return;
                this.scheduler.queue({
                    op: scheduler_1.GraphTaskOp.ComputeSourceMap,
                    nodeId: node.id,
                    trace,
                });
            }),
        ];
    }
    scheduleResolveSourceNode() {
        const handler = ({ id, prop, trace = {} }) => {
            if (prop !== 'data.parsed')
                return;
            this.scheduler.queue({
                op: scheduler_1.GraphTaskOp.ResolveSourceNode,
                nodeId: id,
                trace,
            });
        };
        return [
            this.scheduler.registerHandler(scheduler_1.GraphTaskOp.ResolveSourceNode, taskHandler_1.createTaskHandler({
                selector: node => node.category === nodes_1.NodeCategory.Source,
                run: scheduler_1.resolveSourceNodeHandler,
            }, 'resolver-handler')),
            this.notifier.on(notifier_1.GraphiteEvent.DidPatchSourceNodeProp, handler),
            this.notifier.on(notifier_1.GraphiteEvent.DidSetSourceNodeProp, handler),
        ];
    }
    scheduleValidateSourceNode() {
        const handler = ({ id, prop, trace = {} }) => {
            if (prop !== 'data.parsed')
                return;
            this.scheduler.queue({
                op: scheduler_1.GraphTaskOp.ValidateSourceNode,
                nodeId: id,
                trace,
            });
        };
        return [
            this.notifier.on(notifier_1.GraphiteEvent.DidSetSourceNodeProp, handler),
            this.notifier.on(notifier_1.GraphiteEvent.DidPatchSourceNodeProp, handler),
        ];
    }
}
//# sourceMappingURL=graphite.js.map