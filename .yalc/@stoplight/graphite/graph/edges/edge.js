"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
function createEdge(props) {
    return new Edge(props);
}
exports.createEdge = createEdge;
class Edge {
    constructor(props) {
        this.id = props.id;
        this.type = props.type;
        this.data = props.data;
        this.source = props.source;
        this._source = props.source;
        this.target = props.target;
        this._target = props.target;
    }
    get source() {
        return this._source;
    }
    set source(source) {
        if (source === this.source)
            return;
        if (this.source) {
            lodash_1.pull(this.source.outgoingEdges, this);
        }
        this._source = source;
        if (source) {
            source.outgoingEdges.push(this);
        }
    }
    get sourceId() {
        return this.source ? this.source.id : undefined;
    }
    get target() {
        return this._target;
    }
    set target(target) {
        if (target === this.target)
            return;
        if (this.target) {
            lodash_1.pull(this.target.incomingEdges, this);
        }
        this._target = target;
        if (target) {
            target.incomingEdges.push(this);
        }
    }
    get targetId() {
        return this.target ? this.target.id : undefined;
    }
    dehydrate() {
        return {
            id: this.id,
            sourceId: this.sourceId,
            targetId: this.targetId,
            data: this.data,
        };
    }
    dispose() {
        lodash_1.pull(this.source.outgoingEdges, this);
        lodash_1.pull(this.target.incomingEdges, this);
    }
}
//# sourceMappingURL=edge.js.map