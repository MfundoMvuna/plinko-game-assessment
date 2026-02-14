import { IPeg } from '../core/interfaces';

/**
 * Peg entity — a circular obstacle on the board.
 * Pucks bounce off pegs as they fall.
 */
export class Peg implements IPeg {
  readonly radius: number;
  readonly color: string;
  glowIntensity: number = 0;

  constructor(
    public x: number,
    public y: number,
    radius: number,
    color: string,
  ) {
    this.radius = radius;
    this.color = color;
  }

  triggerGlow(): void {
    this.glowIntensity = 1.0;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Glow effect when hit
    if (this.glowIntensity > 0.05) {
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 15 * this.glowIntensity;
      this.glowIntensity *= 0.92; // Fade out
    } else {
      this.glowIntensity = 0;
    }

    // Draw peg with gradient
    const gradient = ctx.createRadialGradient(
      this.x - this.radius * 0.3,
      this.y - this.radius * 0.3,
      0,
      this.x,
      this.y,
      this.radius,
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.6, this.color);
    gradient.addColorStop(1, this.darkenColor(this.color, 40));

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.closePath();

    ctx.restore();
  }

  private darkenColor(hex: string, amount: number): string {
    // Simple color darkening for named colors
    const colorMap: Record<string, string> = {
      white: '#c0c0c0',
      gray: '#606060',
      '#e0e0e0': '#a0a0a0',
      '#c0c0c0': '#808080',
    };
    return colorMap[hex] ?? hex;
  }
}
