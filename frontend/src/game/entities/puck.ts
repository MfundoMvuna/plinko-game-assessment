import { IPuck } from '../core/interfaces';

let puckIdCounter = 0;

/**
 * Puck entity — the ball that drops through the peg board.
 * Uses real physics (gravity, friction) instead of scripted paths.
 */
export class Puck implements IPuck {
  readonly radius: number;
  readonly id: string;
  speedX: number;
  speedY: number;
  active: boolean = true;
  private trail: Array<{ x: number; y: number; alpha: number }> = [];

  constructor(
    public x: number,
    public y: number,
    radius: number,
  ) {
    this.radius = radius;
    this.id = `puck-${++puckIdCounter}`;
    this.speedX = (Math.random() - 0.5) * 1.5; // Slight random initial horizontal
    this.speedY = 0;
  }

  update(deltaTime: number): void {
    // Store trail point
    this.trail.push({ x: this.x, y: this.y, alpha: 0.6 });
    if (this.trail.length > 8) {
      this.trail.shift();
    }

    // Fade trail
    this.trail.forEach((point) => {
      point.alpha *= 0.85;
    });

    this.x += this.speedX * deltaTime;
    this.y += this.speedY * deltaTime;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Draw trail
    this.trail.forEach((point) => {
      if (point.alpha > 0.05) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, this.radius * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 215, 0, ${point.alpha * 0.3})`;
        ctx.fill();
        ctx.closePath();
      }
    });

    // Glow
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 12;

    // Main puck with gradient
    const gradient = ctx.createRadialGradient(
      this.x - this.radius * 0.3,
      this.y - this.radius * 0.3,
      0,
      this.x,
      this.y,
      this.radius,
    );
    gradient.addColorStop(0, '#fff8dc');
    gradient.addColorStop(0.5, '#ffd700');
    gradient.addColorStop(1, '#b8860b');

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Subtle border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.closePath();

    ctx.restore();
  }
}
