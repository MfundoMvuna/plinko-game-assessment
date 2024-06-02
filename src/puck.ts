export class Puck {
  x: number;
  y: number;
  radius: number;
  speedX: number;
  speedY: number;
  path: number[]; // Array to store the path of the puck
  stepIndex: number;

  constructor(x: number, y: number, radius: number, path: number[]) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.speedX = 0; // Initial horizontal speed with randomness
    this.speedY = 2; // Initial downward speed
    this.path = path; // Initialize path array
    this.stepIndex = 0;
    this.resetSpeed();
  }

  resetSpeed() {
    this.speedX = 0;
    this.speedY = 2;
  }

  update() {
    if(this.path.length > 0) {
      const step = this.path.shift()!;
      this.speedX = step * 2;
    }
    this.x += this.speedX;
    this.y += this.speedY;

    // Simulate gravity
    this.speedY += 0.1;

    // Add friction
    this.speedX *= 0.99;
    this.speedY *= 0.99;

    // Ensure minimum downward speed to avoid getting stuck
    if (this.speedY < 1) {
      this.speedY = 1;
    }

    // Add small random horizontal speed for variability
    // if (Math.random() < 0.1) {
    //   this.speedX += (Math.random() - 0.5) * 0.1;
    // }
  }
  

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'gold';
    ctx.fill();
    ctx.closePath();
  }
}
