"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const peg_1 = require("./peg");
const slot_1 = require("./slot");
const puck_1 = require("./puck");
class Game {
    constructor(canvas, ctx) {
        this.pegs = [];
        this.slots = [];
        this.score = 100;
        this.dropCost = 10;
        this.canvas = canvas;
        this.ctx = ctx;
        this.puck = new puck_1.Puck(canvas.width / 2, 0, 10);
        this.initializePegs();
        this.initializeSlots();
    }
    initializePegs() {
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < row + 1; col++) {
                this.pegs.push(new peg_1.Peg(this.canvas.width / 2 - (row * 20) + (col * 40), row * 40 + 50, 5));
            }
        }
    }
    initializeSlots() {
        const slotWidth = this.canvas.width / 9;
        const slotValues = [10, 5, 2, 1, 0, 1, 2, 5, 10];
        for (let i = 0; i < 9; i++) {
            this.slots.push(new slot_1.Slot(i * slotWidth, this.canvas.height - 50, slotWidth, 50, slotValues[i]));
        }
    }
    detectCollisions() {
        this.pegs.forEach(peg => {
            const dx = this.puck.x - peg.x;
            const dy = this.puck.y - peg.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < this.puck.radius + peg.radius) {
                this.puck.speedY = -this.puck.speedY;
                this.puck.speedX = Math.random() > 0.5 ? 2 : -2;
            }
        });
    }
    checkSlotCollision() {
        if (this.puck.y + this.puck.radius > this.canvas.height - 50) {
            this.slots.forEach(slot => {
                if (this.puck.x > slot.x && this.puck.x < slot.x + slot.width) {
                    this.score += slot.value;
                    this.puck.y = 0;
                    this.puck.x = this.canvas.width / 2;
                }
            });
        }
    }
    start() {
        const gameLoop = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillText(`Score: ${this.score}`, 10, 20);
            this.pegs.forEach(peg => peg.draw(this.ctx));
            this.slots.forEach(slot => slot.draw(this.ctx));
            this.puck.update();
            this.detectCollisions();
            this.checkSlotCollision();
            this.puck.draw(this.ctx);
            requestAnimationFrame(gameLoop);
        };
        gameLoop();
    }
}
exports.Game = Game;
