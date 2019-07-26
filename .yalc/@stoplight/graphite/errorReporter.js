"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const notifier_1 = require("./notifier");
class ErrorReporter {
    constructor(notifier) {
        this.notifier = notifier;
    }
    reportError(error) {
        if (process.env.NODE_ENV === 'production') {
        }
        else if (process.env.NODE_ENV !== 'test') {
            console.error(error);
        }
        this.notifier.emit(notifier_1.GraphiteEvent.DidError, { error });
    }
    onError(handler) {
        return this.notifier.on(notifier_1.GraphiteEvent.DidError, handler);
    }
}
exports.errorReporter = new ErrorReporter(notifier_1.createNotifier());
//# sourceMappingURL=errorReporter.js.map