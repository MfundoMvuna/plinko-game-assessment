export class Slot {
  x: number;
  y: number;
  width: number;
  height: number;
  value: number;
  color: string;
  defaultColor: string;
  highlightColor: string;

  constructor(x: number, y: number, width: number, height: number, value: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.value = value;
    this.defaultColor = '#c93232';
    this.highlightColor = 'red';
    this.color = this.defaultColor;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = 'white';
    ctx.fillText(this.value.toString(), this.x + this.width / 2, this.y + this.height / 2);
  }

  hightlight() {
    this.color = this.highlightColor;
  }

  resetColor() {
    this.color  = this.defaultColor;
  }
}
