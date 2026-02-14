import {
  IGameState,
  IEventBus,
  GameEventType,
  IScoreChangedPayload,
} from '../core/interfaces';

/**
 * GameStateManager — Manages game state (score, running status).
 * Emits events when state changes, enabling decoupled UI updates.
 */
export class GameStateManager implements IGameState {
  score: number;
  dropCost: number;
  isRunning: boolean = false;
  private readonly initialScore: number;

  constructor(
    private readonly eventBus: IEventBus,
    initialScore: number = 100,
    dropCost: number = 10,
  ) {
    this.initialScore = initialScore;
    this.score = initialScore;
    this.dropCost = dropCost;
  }

  canDrop(): boolean {
    return this.score >= this.dropCost;
  }

  deductDropCost(): void {
    const oldScore = this.score;
    this.score -= this.dropCost;
    this.emitScoreChanged(oldScore, this.score);
  }

  addScore(value: number): void {
    const oldScore = this.score;
    this.score += value;
    this.emitScoreChanged(oldScore, this.score);
  }

  reset(): void {
    this.score = this.initialScore;
    this.eventBus.emit({
      type: GameEventType.GAME_RESET,
    });
    this.emitScoreChanged(0, this.score);
  }

  private emitScoreChanged(oldScore: number, newScore: number): void {
    const payload: IScoreChangedPayload = { oldScore, newScore };
    this.eventBus.emit({
      type: GameEventType.SCORE_CHANGED,
      payload,
    });
  }
}
