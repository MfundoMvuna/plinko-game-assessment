import { Peg } from './peg';
import { Slot } from './slot';
import { Puck } from './puck';

function getRandomDirection(): number {
  return Math.random() < 0.5 ? -1 : 1;
}

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  scoreElement: HTMLElement;
  pegs: Peg[] = [];
  slots: Slot[] = [];
  activePuck: Puck | null = null; // Only one active puck at a time
  fallenPucks: Puck[] = []; // Array to hold fallen pucks
  score: number = 100;
  dropCost: number = 10;
  triangleHeight: number = 10;
  slotValues: number[] = [10, 5, 2, 1, 0, 1, 2, 5, 10];
  slotProbabilities: number[] = [1, 1, 1, 2, 3, 2, 1, 1, 1];

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, scoreElement: HTMLElement) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.scoreElement = scoreElement;
    this.initializePegs();
    this.initializeSlots();
  }

  initializePegs() {
    const rows = 10; // Number of rows of pegs
    const cols = 9;  // Number of columns of pegs
    const pegRadius = 5;
    const verticalSpacing = 40;
    const horizontalSpacing = 40;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = this.canvas.width / 2 - (cols * horizontalSpacing) / 2 + col * horizontalSpacing;
        const y = row * verticalSpacing + 50;

        if (row % 2 === 0) {
          this.pegs.push(new Peg(x, y, pegRadius, 'white'));
        } else {
          this.pegs.push(new Peg(x + horizontalSpacing / 2, y, pegRadius, 'gray'));
        }
      }
    }
  }

  initializeSlots() {
    const totalWidth = this.triangleHeight * 40; // Number of columns of pegs
    const slotWidth = (this.canvas.width / this.slotValues.length) / 2;

    for (let i = 0; i < this.slotValues.length; i++) {
      const slot = new Slot((this.canvas.width - totalWidth) / 2 + i * slotWidth, this.canvas.height - 50, slotWidth, 50, this.slotValues[i]);
      this.slots.push(slot);
    }
  }

  createPuck() {
    if (this.score >= this.dropCost) {
      this.score -= this.dropCost;
      this.updateScoreDisplay();

      const desiredSlotIndex = Math.floor(Math.random() * this.slotValues.length);
      const path = this.calculatePathToSlot(desiredSlotIndex);
      this.activePuck = new Puck(this.canvas.width / 2, 0, 10, path);
    } else {
      alert('Not enough points to drop a new puck!');
      const startNewGame = confirm('Do you want to start a new game?');
      if(startNewGame) {
        this.resetGame();
      }
      return;
    }
  }

  resetGame() {
    this.score = 100;
    this.updateScoreDisplay();
    this.activePuck = null;
    this.fallenPucks = [];
    this.pegs = [];
    this.slots = [];
    this.initializePegs();
    this.initializeSlots();
  }

  detectCollisions(puck: Puck) {
    for (let i = 0; i < this.pegs.length; i++) {
      const peg = this.pegs[i];
      const dx = puck.x - peg.x;
      const dy = puck.y - peg.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < puck.radius + peg.radius) {
        const angle = Math.atan2(dy, dx);
        const overlap = puck.radius + peg.radius - distance;

        // Move puck out of collision
        puck.x += overlap * Math.cos(angle);
        puck.y += overlap * Math.sin(angle);

        // Calculate speed and direction
        const speed = Math.sqrt(puck.speedX ** 2 + puck.speedY ** 2);
        const bounceAngle = angle + Math.PI / 2;

        // Apply random direction to horizontal speed
        puck.speedX = speed * Math.cos(bounceAngle) * getRandomDirection();
        puck.speedY = speed * Math.sin(bounceAngle);

        break;
      }
    }
  }

  checkBoundaries(puck: Puck) {
    if (puck.x - puck.radius < 0) {
      puck.x = puck.radius;
      puck.speedX = -puck.speedX * 0.8;
    } else if (puck.x + puck.radius > this.canvas.width) {
      puck.x = this.canvas.width - puck.radius;
      puck.speedX = -puck.speedX * 0.8;
    }

    if (puck.y + puck.radius > this.canvas.height) {
      puck.y = this.canvas.height - puck.radius;
      puck.speedY = -Math.abs(puck.speedY * 0.8);
    }
  }

  checkSlotCollision(puck: Puck) {
    if (this.checkPuckInSlot(puck)) {
      if(this.activePuck) {
        this.activePuck.draw(this.ctx);
      }
       // Draw the puck in its final position
      this.activePuck = null; // Remove the puck from active pucks
    }
  }

  private checkPuckInSlot(puck: Puck): boolean {
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      const slotTop = this.canvas.height - 50;
      if (puck.y + puck.radius >= slotTop && puck.x > slot.x && puck.x < slot.x + slot.width) {
        this.score += slot.value;

        slot.hightlight();

        this.updateScoreDisplay();
        puck.y = slotTop - puck.radius;
        puck.speedX = 0;
        puck.speedY = 0;
        this.fallenPucks.push(puck);
        return true;
      }
    }
    return false;
  }

  private calculatePathToSlot(desiredSlotIndex: number): number[] {
    const path: number[] = [];
    const centerSlotIndex = Math.floor(this.slotValues.length / 2);

    let currentSlotIndex = centerSlotIndex;
    const totalSteps = this.triangleHeight;

    for (let i = 0; i < totalSteps; i++) {
      if (currentSlotIndex < desiredSlotIndex) {
        path.push(1);
        currentSlotIndex++;
      } else if (currentSlotIndex > desiredSlotIndex) {
        path.push(-1);
        currentSlotIndex--;
      } else {
        path.push(Math.random() < 0.5 ? -1 : 1);
      }
    }

    return path;
  }

  updateScoreDisplay() {
    if (this.scoreElement) {
      this.scoreElement.textContent = `Balance: ${this.score}`;
    }
  }

  start() {
    const gameLoop = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      this.pegs.forEach(peg => peg.draw(this.ctx));
      this.slots.forEach(slot => slot.draw(this.ctx));

      // Check if there's an active puck
      if (this.activePuck) {
        this.activePuck.update();
        this.detectCollisions(this.activePuck);
        this.checkBoundaries(this.activePuck);
        this.activePuck.draw(this.ctx);
        this.checkSlotCollision(this.activePuck);
      }

      // Draw fallen pucks
      this.fallenPucks.forEach(puck => puck.draw(this.ctx));

      requestAnimationFrame(gameLoop);
    };

    gameLoop();
  }
}