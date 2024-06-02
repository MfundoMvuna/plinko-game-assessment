"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Peg = void 0;
class Peg {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
    }
}
exports.Peg = Peg;
