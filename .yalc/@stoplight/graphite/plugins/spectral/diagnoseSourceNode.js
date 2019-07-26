"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const getLocationForJsonPath_1 = require("@stoplight/json/getLocationForJsonPath");
const spectral_1 = require("@stoplight/spectral");
const oas2_1 = require("@stoplight/spectral/dist/rulesets/oas2");
const oas3_1 = require("@stoplight/spectral/dist/rulesets/oas3");
const reader_1 = require("@stoplight/spectral/dist/rulesets/reader");
const yaml_1 = require("@stoplight/yaml");
const nodes_1 = require("../../graph/nodes");
const getLocationForJsonPath = {
    yaml: yaml_1.getLocationForJsonPath,
    json: getLocationForJsonPath_1.getLocationForJsonPath,
};
function createDiagnoseSourceNodeHandler() {
    let spectralOas2;
    let spectralOas3;
    return (node, { setSourceNodeDiagnostics, resolver }) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (node.category !== nodes_1.NodeCategory.Source)
            return;
        if ((node.spec !== nodes_1.Specs.OAS2 && node.spec !== nodes_1.Specs.OAS3) ||
            !node.language ||
            !getLocationForJsonPath[node.language])
            return;
        if (!spectralOas2) {
            spectralOas2 = new spectral_1.Spectral({ resolver });
            spectralOas2.addFunctions(oas2_1.oas2Functions());
            spectralOas2.addRules(yield reader_1.readRulesFromRulesets('spectral:oas2'));
        }
        if (!spectralOas3) {
            spectralOas3 = new spectral_1.Spectral({ resolver });
            spectralOas3.addFunctions(oas3_1.oas3Functions());
            spectralOas3.addRules(yield reader_1.readRulesFromRulesets('spectral:oas3'));
        }
        const parserResult = {
            parsed: {
                data: node.data.parsed,
                ast: node.data.ast || {},
                lineMap: node.data.lineMap,
                diagnostics: node.data.diagnostics,
            },
            getLocationForJsonPath: getLocationForJsonPath[node.language],
        };
        if (node.spec === nodes_1.Specs.OAS2) {
            setSourceNodeDiagnostics(node.id, (yield spectralOas2.run(parserResult)) || []);
        }
        if (node.spec === nodes_1.Specs.OAS3) {
            setSourceNodeDiagnostics(node.id, (yield spectralOas3.run(parserResult)) || []);
        }
    });
}
exports.createDiagnoseSourceNodeHandler = createDiagnoseSourceNodeHandler;
//# sourceMappingURL=diagnoseSourceNode.js.map