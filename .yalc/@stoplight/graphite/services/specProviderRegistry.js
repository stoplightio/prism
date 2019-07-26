"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SpecProviderRegistry {
    constructor() {
        this.identifiersRegistry = [];
    }
    register(identifier) {
        const identifiersRegistry = this.identifiersRegistry;
        identifiersRegistry.push(identifier);
        return {
            dispose() {
                identifiersRegistry.splice(identifiersRegistry.indexOf(identifier), 1);
            },
        };
    }
    provideByContent(parsed) {
        const found = this.identifiersRegistry.find(identifier => !!(identifier.content && identifier.content(parsed)));
        return found ? found.spec : undefined;
    }
    provideByPath(path) {
        const found = this.identifiersRegistry.find(identifier => !!path.match(identifier.path));
        return found ? found.spec : undefined;
    }
}
exports.SpecProviderRegistry = SpecProviderRegistry;
exports.registry = new SpecProviderRegistry();
//# sourceMappingURL=specProviderRegistry.js.map