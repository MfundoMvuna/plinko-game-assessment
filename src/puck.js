"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Puck = void 0;
class Puck {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.speedX = 0;
        this.speedY = 2;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'red';
        ctx.fill();
    }
}
exports.Puck = Puck;
