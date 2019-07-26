"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lifecycle_1 = require("@stoplight/lifecycle");
const mobx_1 = require("mobx");
const filesystem_1 = require("../../backends/filesystem");
const specProviderRegistry_1 = require("../../services/specProviderRegistry");
const dom_1 = require("../dom");
class SourceNodeService {
    constructor(graph) {
        this.graph = graph;
    }
    observeSpec(node) {
        if (node.type !== filesystem_1.FilesystemNodeType.File) {
            return;
        }
        return node.disposables.pushAll([this.reactToPathChange(node), this.reactToParsedChange(node)]);
    }
    reactToParsedChange(node) {
        return lifecycle_1.createDisposable(mobx_1.reaction(() => node.data.parsed, parsed => {
            if (!parsed) {
                return;
            }
            const spec = specProviderRegistry_1.registry.provideByContent(parsed);
            if (spec && spec !== node.spec) {
                this.setSpec(node, spec);
            }
        }, {
            fireImmediately: true,
        }));
    }
    reactToPathChange(node) {
        return lifecycle_1.createDisposable(mobx_1.reaction(() => node.path, path => {
            this.setSpec(node, specProviderRegistry_1.registry.provideByPath(path) || node.spec);
        }, {
            fireImmediately: true,
        }));
    }
    setSpec(node, spec) {
        this.graph.applyPatch({
            operations: [
                {
                    op: dom_1.GraphOp.SetSourceNodeProp,
                    id: node.id,
                    prop: 'spec',
                    value: spec,
                },
            ],
            trace: {},
        });
    }
}
exports.SourceNodeService = SourceNodeService;
//# sourceMappingURL=sourceService.js.map