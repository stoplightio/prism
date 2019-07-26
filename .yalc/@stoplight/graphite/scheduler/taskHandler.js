"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
class TaskHandler {
    constructor(decoratee, id) {
        this.decoratee = decoratee;
        this.id = id;
    }
    selector(node) {
        return this.decoratee.selector(node);
    }
    run(node, api) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.decoratee.run(node, api);
            }
            catch (error) {
                api.reportError(node.id, error, api.task && api.task.trace);
            }
        });
    }
}
exports.TaskHandler = TaskHandler;
exports.createTaskHandler = (decoratee, id) => {
    return new TaskHandler(decoratee, id);
};
//# sourceMappingURL=taskHandler.js.map