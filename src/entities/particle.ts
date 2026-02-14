import { IParticle } from '../core/interfaces';

/**
 * Particle entity — used for visual effects (collision sparks, slot celebration).
 */
export class Particle implements IParticle {
  alive: boolean = true;
  life: number;
  private maxLife: number;
  private vx: number;
  private vy: number;
  private size: number;
  private color: string;

  constructor(
    public x: number,
    public y: number,
    color: string,
  ) {
    this.color = color;
    this.maxLife = 30 + Math.random() * 30;
    this.life = this.maxLife;
    this.size = 2 + Math.random() * 3;
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(deltaTime: number): void {
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.vy += 0.05 * deltaTime; // gravity on particles
    this.life -= deltaTime;
    if (this.life <= 0) {
      this.alive = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.alive) return;

    const alpha = Math.max(0, this.life / this.maxLife);
    const currentSize = this.size * alpha;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  }
}
