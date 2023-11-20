"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class InnovationCounter {
    constructor(count = 0) {
        this.count = count;
    }
    next() {
        this.count++;
        return this.count;
    }
}
exports.default = InnovationCounter;
//# sourceMappingURL=innovation-counter.js.map