"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const game_1 = require("./game");
const canvas = document.getElementById('plinkoCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;
const game = new game_1.Game(canvas, ctx);
game.start();
