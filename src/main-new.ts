import { DIContainer, ServiceTokens } from './core/di-container';
import { EventBus } from './core/event-bus';
import {
  IEventBus,
  IRenderer,
  IPhysicsEngine,
  IGameState,
  IParticleSystem,
  IPegFactory,
  IPuckFactory,
  ISlotFactory,
  GameEventType,
  IScoreChangedPayload,
} from './core/interfaces';
import { CanvasRenderer } from './services/renderer';
import { PhysicsEngine } from './services/physics-engine';
import { GameStateManager } from './services/game-state';
import { ParticleSystem } from './services/particle-system';
import { PegFactory } from './factories/peg-factory';
import { PuckFactory } from './factories/puck-factory';
import { SlotFactory } from './factories/slot-factory';
import { Game } from './game/game';

/**
 * Application bootstrap — Composition Root.
 * All dependency wiring happens here.
 * No other module creates its own dependencies.
 */
function bootstrap(): void {
  // ─── DOM Elements ────────────────────────────────────────
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  const playButton = document.getElementById('playButton') as HTMLButtonElement;
  const resetButton = document.getElementById('resetButton') as HTMLButtonElement;
  const scoreElement = document.getElementById('scoreDisplay') as HTMLElement;
  const messageElement = document.getElementById('messageDisplay') as HTMLElement;

  if (!canvas) throw new Error('Canvas element not found');

  canvas.width = 800;
  canvas.height = 600;

  // ─── DI Container Setup ─────────────────────────────────
  const container = new DIContainer();

  // Register singletons (shared instances)
  container.registerSingleton<IEventBus>(ServiceTokens.EventBus, () => new EventBus());

  container.registerSingleton<IRenderer>(
    ServiceTokens.Renderer,
    () => new CanvasRenderer(canvas),
  );

  container.registerSingleton<IPhysicsEngine>(
    ServiceTokens.PhysicsEngine,
    () => new PhysicsEngine(0.15, 0.998, 0.6, 0.7),
  );

  container.registerSingleton<IGameState>(ServiceTokens.GameState, () => {
    const eventBus = container.resolve<IEventBus>(ServiceTokens.EventBus);
    return new GameStateManager(eventBus, 100, 10);
  });

  container.registerSingleton<IParticleSystem>(
    ServiceTokens.ParticleSystem,
    () => new ParticleSystem(),
  );

  // Register factories (stateless, can be singletons)
  container.registerSingleton<IPegFactory>(ServiceTokens.PegFactory, () => new PegFactory());
  container.registerSingleton<IPuckFactory>(ServiceTokens.PuckFactory, () => new PuckFactory());
  container.registerSingleton<ISlotFactory>(ServiceTokens.SlotFactory, () => new SlotFactory());

  // Register Game (the orchestrator)
  container.registerSingleton(ServiceTokens.Game, () => {
    return new Game(
      container.resolve<IRenderer>(ServiceTokens.Renderer),
      container.resolve<IPhysicsEngine>(ServiceTokens.PhysicsEngine),
      container.resolve<IGameState>(ServiceTokens.GameState),
      container.resolve<IParticleSystem>(ServiceTokens.ParticleSystem),
      container.resolve<IEventBus>(ServiceTokens.EventBus),
      container.resolve<IPegFactory>(ServiceTokens.PegFactory),
      container.resolve<IPuckFactory>(ServiceTokens.PuckFactory),
      container.resolve<ISlotFactory>(ServiceTokens.SlotFactory),
    );
  });

  // ─── Resolve & Wire ─────────────────────────────────────
  const eventBus = container.resolve<IEventBus>(ServiceTokens.EventBus);
  const gameState = container.resolve<IGameState>(ServiceTokens.GameState);
  const game = container.resolve<Game>(ServiceTokens.Game);

  // ─── UI Event Handlers (Observer Pattern) ───────────────

  // Score display updates via events (not direct coupling)
  eventBus.on(GameEventType.SCORE_CHANGED, (event) => {
    const payload = event.payload as IScoreChangedPayload;
    scoreElement.textContent = `Balance: ${payload.newScore}`;

    // Animate score change
    scoreElement.classList.remove('score-bump');
    void scoreElement.offsetWidth; // force reflow
    scoreElement.classList.add('score-bump');

    // Update button state
    playButton.disabled = !gameState.canDrop();
  });

  eventBus.on(GameEventType.GAME_OVER, () => {
    showMessage('Game Over! Click "New Game" to play again.', 'warning');
    playButton.disabled = true;
  });

  eventBus.on(GameEventType.GAME_RESET, () => {
    hideMessage();
    playButton.disabled = false;
  });

  // ─── Button Handlers ────────────────────────────────────

  playButton.addEventListener('click', () => {
    if (!game.dropPuck()) {
      showMessage('Not enough balance! Start a new game.', 'warning');
    }
  });

  resetButton.addEventListener('click', () => {
    game.reset();
    scoreElement.textContent = `Balance: ${gameState.score}`;
  });

  // Keyboard shortcut (Space to drop)
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (!game.dropPuck()) {
        showMessage('Not enough balance! Start a new game.', 'warning');
      }
    }
  });

  // ─── Helper Functions ───────────────────────────────────

  function showMessage(text: string, type: 'info' | 'warning' = 'info'): void {
    if (messageElement) {
      messageElement.textContent = text;
      messageElement.className = `message ${type}`;
      messageElement.style.display = 'block';
      setTimeout(() => hideMessage(), 3000);
    }
  }

  function hideMessage(): void {
    if (messageElement) {
      messageElement.style.display = 'none';
    }
  }

  // ─── Start the Game ─────────────────────────────────────
  game.start();
}

// ─── Entry Point ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', bootstrap);
