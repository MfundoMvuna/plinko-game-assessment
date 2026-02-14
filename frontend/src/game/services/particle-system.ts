import { IParticleSystem } from '../core/interfaces';
import { Particle } from '../entities/particle';

/**
 * ParticleSystem — Manages creation, updating, and rendering of particle effects.
 * Used for collision sparks and slot celebration effects.
 */
export class ParticleSystem implements IParticleSystem {
  private particles: Particle[] = [];

  emit(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, color));
    }
  }

  update(deltaTime: number): void {
    for (const particle of this.particles) {
      particle.update(deltaTime);
    }
    // Remove dead particles
    this.particles = this.particles.filter((p) => p.alive);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const particle of this.particles) {
      particle.draw(ctx);
    }
  }
}
