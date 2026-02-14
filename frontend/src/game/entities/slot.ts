import { ISlot } from '../core/interfaces';

/**
 * Slot entity — the scoring bucket at the bottom of the board.
 * Each slot has a multiplier value and color-coding by value.
 */
export class Slot implements ISlot {
  readonly value: number;
  readonly multiplierLabel: string;
  color: string;
  private readonly baseColor: string;
  private readonly highlightColor: string;
  private highlightTimer: number = 0;

  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number,
    value: number,
  ) {
    this.value = value;
    this.multiplierLabel = `${value}x`;
    this.baseColor = this.getColorForValue(value);
    this.highlightColor = this.getHighlightColorForValue(value);
    this.color = this.baseColor;
  }

  highlight(): void {
    this.color = this.highlightColor;
    this.highlightTimer = 60; // frames
  }

  resetColor(): void {
    this.color = this.baseColor;
    this.highlightTimer = 0;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Auto-decay highlight
    if (this.highlightTimer > 0) {
      this.highlightTimer--;
      if (this.highlightTimer <= 0) {
        this.color = this.baseColor;
      }
    }

    // Slot background with gradient
    const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, this.darken(this.color, 30));

    ctx.fillStyle = gradient;

    // Rounded top corners
    const r = 4;
    ctx.beginPath();
    ctx.moveTo(this.x + r, this.y);
    ctx.lineTo(this.x + this.width - r, this.y);
    ctx.quadraticCurveTo(this.x + this.width, this.y, this.x + this.width, this.y + r);
    ctx.lineTo(this.x + this.width, this.y + this.height);
    ctx.lineTo(this.x, this.y + this.height);
    ctx.lineTo(this.x, this.y + r);
    ctx.quadraticCurveTo(this.x, this.y, this.x + r, this.y);
    ctx.closePath();
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Multiplier text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 2;
    ctx.fillText(this.multiplierLabel, this.x + this.width / 2, this.y + this.height / 2);

    ctx.restore();
  }

  /** Map slot value to a color — higher values get warmer (more rewarding) colors */
  private getColorForValue(value: number): string {
    const colorMap: Record<number, string> = {
      0:  '#4a5568', // gray
      1:  '#2d6a4f', // green
      2:  '#1d4ed8', // blue
      5:  '#7c3aed', // purple
      10: '#dc2626', // red (jackpot)
    };
    return colorMap[value] ?? '#4a5568';
  }

  private getHighlightColorForValue(value: number): string {
    const colorMap: Record<number, string> = {
      0:  '#718096',
      1:  '#40916c',
      2:  '#3b82f6',
      5:  '#8b5cf6',
      10: '#ef4444',
    };
    return colorMap[value] ?? '#718096';
  }

  private darken(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0x00ff) - amount);
    const b = Math.max(0, (num & 0x0000ff) - amount);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }
}
