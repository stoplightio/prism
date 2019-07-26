"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const path_1 = require("@stoplight/path");
const fs = require("fs");
const filesystem_1 = require("./backends/filesystem");
const nodes_1 = require("./graph/nodes");
const graphite_1 = require("./graphite");
const json_1 = require("./plugins/json");
const json_schema_1 = require("./plugins/json-schema");
const oas2_1 = require("./plugins/oas2");
const oas3_1 = require("./plugins/oas3");
const yaml_1 = require("./plugins/yaml");
const cwdOptions = {
    fixtures: path_1.resolve(__dirname, '..', '..', 'graphite-simple', 'fixtures'),
    dev: path_1.resolve(__dirname, '..', '..'),
};
const demos = {
    file: path_1.join('example', 'api.oas2.json'),
    small: path_1.join('example'),
    crux: path_1.join('crux'),
    huge: path_1.join('openapi-directory', 'APIs', 'azure.com'),
    insane: path_1.join('openapi-directory'),
    stoplight_workspace: path_1.join('.'),
};
const cwd = cwdOptions.fixtures;
const target = demos.huge;
const mirror = false;
const dir = path_1.join(cwd, target);
const graphite = graphite_1.createGraphite();
graphite.registerPlugins(json_1.createJsonPlugin(), yaml_1.createYamlPlugin(), oas2_1.createOas2Plugin(), json_schema_1.createJsonSchemaPlugin(), oas3_1.createOas3Plugin());
const run = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
    console.log('start!');
    graphite.graph.addNode({
        category: nodes_1.NodeCategory.Source,
        type: filesystem_1.FilesystemNodeType.Directory,
        path: dir,
    });
    filesystem_1.createFileSystemBackend(graphite, fs).readdir(dir);
    yield graphite.scheduler.drain();
    console.log(`resulting graph:
  - ${graphite.graph.sourceNodes.filter(n => n.type === filesystem_1.FilesystemNodeType.Directory).length} directory nodes
  - ${graphite.graph.sourceNodes.filter(n => n.type === filesystem_1.FilesystemNodeType.File).length} document nodes
  - ${graphite.graph.nodeValues.filter(n => n.category === nodes_1.NodeCategory.SourceMap || n.category === nodes_1.NodeCategory.Virtual)
        .length} symbol nodes
`);
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`The script used approximately ${Math.round(used)} MB of memory`);
});
run();
//# sourceMappingURL=benchmark.js.map