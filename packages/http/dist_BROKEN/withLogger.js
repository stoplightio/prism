"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Reader_1 = require("fp-ts/Reader");
function withLogger(run) {
    return Reader_1.asks(run);
}
exports.default = withLogger;
