import { IDIContainer } from './interfaces';

/**
 * DIContainer — Simple Dependency Injection container.
 * Supports transient and singleton registrations.
 * Allows components to be wired together without direct dependencies.
 */
export class DIContainer implements IDIContainer {
  private factories: Map<string, () => unknown> = new Map();
  private singletons: Map<string, unknown> = new Map();
  private isSingleton: Set<string> = new Set();

  register<T>(token: string, factory: () => T): void {
    this.factories.set(token, factory);
    this.isSingleton.delete(token);
    this.singletons.delete(token);
  }

  registerSingleton<T>(token: string, factory: () => T): void {
    this.factories.set(token, factory);
    this.isSingleton.add(token);
  }

  resolve<T>(token: string): T {
    if (this.isSingleton.has(token)) {
      if (!this.singletons.has(token)) {
        const factory = this.factories.get(token);
        if (!factory) {
          throw new Error(`[DIContainer] No registration found for token: "${token}"`);
        }
        this.singletons.set(token, factory());
      }
      return this.singletons.get(token) as T;
    }

    const factory = this.factories.get(token);
    if (!factory) {
      throw new Error(`[DIContainer] No registration found for token: "${token}"`);
    }
    return factory() as T;
  }
}

/** Service tokens for DI resolution */
export const ServiceTokens = {
  EventBus: 'EventBus',
  PhysicsEngine: 'PhysicsEngine',
  Renderer: 'Renderer',
  GameState: 'GameState',
  ParticleSystem: 'ParticleSystem',
  PegFactory: 'PegFactory',
  PuckFactory: 'PuckFactory',
  SlotFactory: 'SlotFactory',
  Game: 'Game',
} as const;
