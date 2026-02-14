import { IEventBus, IGameEvent, GameEventType, EventHandler } from './interfaces';

/**
 * EventBus — Observer Pattern implementation.
 * Provides decoupled communication between game components.
 * Any component can publish events without knowing who's listening.
 */
export class EventBus implements IEventBus {
  private handlers: Map<GameEventType, Set<EventHandler>> = new Map();

  on(eventType: GameEventType, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
  }

  off(eventType: GameEventType, handler: EventHandler): void {
    const set = this.handlers.get(eventType);
    if (set) {
      set.delete(handler);
    }
  }

  emit(event: IGameEvent): void {
    const set = this.handlers.get(event.type);
    if (set) {
      set.forEach((handler) => {
        try {
          handler(event);
        } catch (err) {
          console.error(`[EventBus] Error in handler for ${event.type}:`, err);
        }
      });
    }
  }
}
