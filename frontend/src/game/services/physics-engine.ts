import { IPhysicsEngine, IPuck, IPeg, ISlot } from '../core/interfaces';

/**
 * PhysicsEngine — Strategy Pattern implementation.
 * Encapsulates all physics logic: gravity, friction, collisions, boundaries.
 * Can be swapped for an alternative implementation (e.g., faster/simpler physics).
 */
export class PhysicsEngine implements IPhysicsEngine {
  private readonly gravity: number;
  private readonly friction: number;
  private readonly bounceDamping: number;
  private readonly wallDamping: number;

  constructor(
    gravity: number = 0.15,
    friction: number = 0.998,
    bounceDamping: number = 0.6,
    wallDamping: number = 0.7,
  ) {
    this.gravity = gravity;
    this.friction = friction;
    this.bounceDamping = bounceDamping;
    this.wallDamping = wallDamping;
  }

  applyGravity(puck: IPuck, deltaTime: number): void {
    puck.speedY += this.gravity * deltaTime;
  }

  applyFriction(puck: IPuck): void {
    puck.speedX *= this.friction;
    puck.speedY *= this.friction;
  }

  detectPegCollision(puck: IPuck, pegs: IPeg[]): IPeg | null {
    for (const peg of pegs) {
      const dx = puck.x - peg.x;
      const dy = puck.y - peg.y;
      const distSq = dx * dx + dy * dy;
      const minDist = puck.radius + peg.radius;

      if (distSq < minDist * minDist) {
        const distance = Math.sqrt(distSq);
        const overlap = minDist - distance;

        if (distance === 0) {
          // Edge case: perfectly overlapping
          puck.x += minDist;
          puck.speedX = 2;
          puck.speedY = 1;
          return peg;
        }

        // Normalize collision vector
        const nx = dx / distance;
        const ny = dy / distance;

        // Push puck out of collision
        puck.x += nx * (overlap + 1);
        puck.y += ny * (overlap + 1);

        // Reflect velocity off the collision normal
        const dotProduct = puck.speedX * nx + puck.speedY * ny;
        puck.speedX -= 2 * dotProduct * nx;
        puck.speedY -= 2 * dotProduct * ny;

        // Apply bounce damping
        puck.speedX *= this.bounceDamping;
        puck.speedY *= this.bounceDamping;

        // Add randomness to horizontal bounce (the core Plinko mechanic)
        puck.speedX += (Math.random() - 0.5) * 1.5;

        // Ensure puck moves downward after bounce
        if (puck.speedY < 0.5) {
          puck.speedY = 0.5;
        }

        return peg;
      }
    }
    return null;
  }

  checkBoundaries(puck: IPuck, canvasWidth: number, canvasHeight: number): void {
    // Left wall
    if (puck.x - puck.radius < 0) {
      puck.x = puck.radius;
      puck.speedX = Math.abs(puck.speedX) * this.wallDamping;
    }
    // Right wall
    if (puck.x + puck.radius > canvasWidth) {
      puck.x = canvasWidth - puck.radius;
      puck.speedX = -Math.abs(puck.speedX) * this.wallDamping;
    }
    // Floor (safety net)
    if (puck.y + puck.radius > canvasHeight) {
      puck.y = canvasHeight - puck.radius;
      puck.speedY = -Math.abs(puck.speedY) * 0.3;
    }
  }

  checkSlotCollision(puck: IPuck, slots: ISlot[], canvasHeight: number): ISlot | null {
    const slotTop = canvasHeight - 50;

    if (puck.y + puck.radius >= slotTop) {
      for (const slot of slots) {
        if (puck.x >= slot.x && puck.x <= slot.x + slot.width) {
          // Settle puck into slot
          puck.y = slotTop - puck.radius;
          puck.speedX = 0;
          puck.speedY = 0;
          puck.active = false;
          return slot;
        }
      }
    }
    return null;
  }
}
