import {
  IPhysicsEngine,
  IRenderer,
  IGameState,
  IParticleSystem,
  IPegFactory,
  IPuckFactory,
  ISlotFactory,
  IEventBus,
  IPeg,
  IPuck,
  ISlot,
  GameEventType,
  IPuckLandedPayload,
  IPegHitPayload,
} from '../core/interfaces';

/**
 * Game — The orchestrator (application layer).
 * Coordinates between all services using dependency injection.
 * Does NOT contain physics, rendering, or state logic directly.
 * Follows Single Responsibility Principle.
 */
export class Game {
  private pegs: IPeg[] = [];
  private slots: ISlot[] = [];
  private activePucks: IPuck[] = [];
  private fallenPucks: IPuck[] = [];
  private lastTimestamp: number = 0;
  private scorePopups: Array<{
    x: number;
    y: number;
    value: number;
    life: number;
    maxLife: number;
  }> = [];

  constructor(
    private readonly renderer: IRenderer,
    private readonly physics: IPhysicsEngine,
    private readonly gameState: IGameState,
    private readonly particleSystem: IParticleSystem,
    private readonly eventBus: IEventBus,
    private readonly pegFactory: IPegFactory,
    private readonly puckFactory: IPuckFactory,
    private readonly slotFactory: ISlotFactory,
  ) {
    this.initializeBoard();
  }

  private initializeBoard(): void {
    this.pegs = this.pegFactory.createPegGrid(this.renderer.getWidth());
    this.slots = this.slotFactory.createSlotRow(
      this.renderer.getWidth(),
      this.renderer.getHeight(),
    );
  }

  /** Drop a new puck — called by input handler */
  dropPuck(): boolean {
    if (!this.gameState.canDrop()) {
      return false;
    }

    this.gameState.deductDropCost();
    const puck = this.puckFactory.createPuck(
      this.renderer.getWidth() / 2 + (Math.random() - 0.5) * 20,
      15,
      8,
    );

    this.activePucks.push(puck);
    this.eventBus.emit({ type: GameEventType.PUCK_DROPPED, payload: puck });
    return true;
  }

  /** Reset the entire game */
  reset(): void {
    this.activePucks = [];
    this.fallenPucks = [];
    this.scorePopups = [];
    this.pegs = [];
    this.slots = [];
    this.gameState.reset();
    this.initializeBoard();
  }

  /** Main game loop */
  start(): void {
    this.gameState.isRunning = true;
    this.lastTimestamp = performance.now();
    const gameLoop = (timestamp: number) => {
      const rawDelta = timestamp - this.lastTimestamp;
      this.lastTimestamp = timestamp;

      // Cap delta to prevent spiral of death
      const deltaTime = Math.min(rawDelta / 16.67, 3);

      this.update(deltaTime);
      this.render();

      if (this.gameState.isRunning) {
        requestAnimationFrame(gameLoop);
      }
    };
    requestAnimationFrame(gameLoop);
  }

  private update(deltaTime: number): void {
    // Update active pucks
    for (let i = this.activePucks.length - 1; i >= 0; i--) {
      const puck = this.activePucks[i];

      // Physics step
      this.physics.applyGravity(puck, deltaTime);
      puck.update(deltaTime);
      this.physics.applyFriction(puck);

      // Collision detection
      const hitPeg = this.physics.detectPegCollision(puck, this.pegs);
      if (hitPeg) {
        hitPeg.triggerGlow();
        this.particleSystem.emit(hitPeg.x, hitPeg.y, '#ffd700', 5);
        const pegPayload: IPegHitPayload = { puck, peg: hitPeg };
        this.eventBus.emit({ type: GameEventType.PEG_HIT, payload: pegPayload });
      }

      // Boundary check
      this.physics.checkBoundaries(puck, this.renderer.getWidth(), this.renderer.getHeight());

      // Slot collision
      const hitSlot = this.physics.checkSlotCollision(
        puck,
        this.slots,
        this.renderer.getHeight(),
      );
      if (hitSlot) {
        hitSlot.highlight();
        this.gameState.addScore(hitSlot.value);
        this.fallenPucks.push(puck);
        this.activePucks.splice(i, 1);

        // Score popup
        this.scorePopups.push({
          x: hitSlot.x + hitSlot.width / 2,
          y: hitSlot.y - 10,
          value: hitSlot.value,
          life: 60,
          maxLife: 60,
        });

        // Celebration particles
        const particleCount = hitSlot.value >= 5 ? 25 : 10;
        const color = hitSlot.value >= 10 ? '#ff4444' : hitSlot.value >= 5 ? '#8b5cf6' : '#ffd700';
        this.particleSystem.emit(
          hitSlot.x + hitSlot.width / 2,
          hitSlot.y,
          color,
          particleCount,
        );

        const landedPayload: IPuckLandedPayload = {
          puck,
          slot: hitSlot,
          value: hitSlot.value,
        };
        this.eventBus.emit({ type: GameEventType.PUCK_LANDED, payload: landedPayload });

        // Check game over
        if (!this.gameState.canDrop() && this.activePucks.length === 0) {
          this.eventBus.emit({ type: GameEventType.GAME_OVER });
        }
      }
    }

    // Update particles
    this.particleSystem.update(deltaTime);

    // Update score popups
    for (let i = this.scorePopups.length - 1; i >= 0; i--) {
      this.scorePopups[i].life -= deltaTime;
      this.scorePopups[i].y -= 0.5 * deltaTime;
      if (this.scorePopups[i].life <= 0) {
        this.scorePopups.splice(i, 1);
      }
    }
  }

  private render(): void {
    const ctx = this.renderer.getContext();

    this.renderer.clear();
    this.renderer.drawBackground();

    // Draw slots (behind everything)
    for (const slot of this.slots) {
      slot.draw(ctx);
    }

    // Draw pegs
    for (const peg of this.pegs) {
      peg.draw(ctx);
    }

    // Draw fallen pucks
    for (const puck of this.fallenPucks) {
      puck.draw(ctx);
    }

    // Draw active pucks
    for (const puck of this.activePucks) {
      puck.draw(ctx);
    }

    // Draw particles (on top)
    this.particleSystem.draw(ctx);

    // Draw score popups
    for (const popup of this.scorePopups) {
      const alpha = Math.max(0, popup.life / popup.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = popup.value >= 5 ? '#ff4444' : popup.value > 0 ? '#4ade80' : '#94a3b8';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(`+${popup.value}`, popup.x, popup.y);
      ctx.restore();
    }

    // Draw drop zone indicator
    this.drawDropZone(ctx);
  }

  private drawDropZone(ctx: CanvasRenderingContext2D): void {
    const centerX = this.renderer.getWidth() / 2;
    const y = 8;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(centerX - 20, y);
    ctx.lineTo(centerX + 20, y);
    ctx.stroke();

    // Arrow
    ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
    ctx.beginPath();
    ctx.moveTo(centerX, y + 10);
    ctx.lineTo(centerX - 6, y);
    ctx.lineTo(centerX + 6, y);
    ctx.closePath();
    ctx.fill();
    ctx.setLineDash([]);
    ctx.restore();
  }
}
