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
import { LeaderboardService, LeaderboardEntry } from './services/leaderboard-service';

// ─── Configuration ──────────────────────────────────────────
// Set these after deploying your SAM backend:
const API_URL = ''; // e.g. 'https://abc123.execute-api.us-east-1.amazonaws.com/dev'
const WS_URL = '';  // e.g. 'wss://xyz789.execute-api.us-east-1.amazonaws.com/dev'

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

  // Leaderboard UI elements
  const leaderboardList = document.getElementById('leaderboardList') as HTMLOListElement;
  const leaderboardStatus = document.getElementById('leaderboardStatus') as HTMLElement;
  const leaderboardEmpty = document.getElementById('leaderboardEmpty') as HTMLElement;
  const scoreModal = document.getElementById('scoreModal') as HTMLElement;
  const finalScoreEl = document.getElementById('finalScore') as HTMLElement;
  const playerNameInput = document.getElementById('playerNameInput') as HTMLInputElement;
  const submitScoreBtn = document.getElementById('submitScoreBtn') as HTMLButtonElement;
  const skipScoreBtn = document.getElementById('skipScoreBtn') as HTMLButtonElement;
  const submitResult = document.getElementById('submitResult') as HTMLElement;

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

  // ─── Leaderboard Service ────────────────────────────────
  const leaderboard = API_URL ? new LeaderboardService(API_URL, WS_URL || null) : null;
  let dropsUsed = 0;
  let maxMultiplier = 0;

  function renderLeaderboard(entries: LeaderboardEntry[]): void {
    leaderboardStatus.style.display = 'none';
    if (entries.length === 0) {
      leaderboardEmpty.style.display = 'block';
      leaderboardList.innerHTML = '';
      return;
    }
    leaderboardEmpty.style.display = 'none';
    leaderboardList.innerHTML = entries
      .map(
        (e, i) =>
          `<li class="lb-entry${i < 3 ? ' lb-top' : ''}">
            <span class="lb-rank">${i + 1}</span>
            <span class="lb-name">${escapeHtml(e.playerName)}</span>
            <span class="lb-score">${e.score}</span>
          </li>`,
      )
      .join('');
  }

  function escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Load leaderboard on startup
  if (leaderboard) {
    leaderboard.getLeaderboard().then(renderLeaderboard);
    if (WS_URL) {
      leaderboard.connectWebSocket();
      leaderboard.onLeaderboardUpdate(renderLeaderboard);
      leaderboard.onNewHighScore(() => {
        leaderboard.getLeaderboard().then(renderLeaderboard);
      });
    }
  } else {
    leaderboardStatus.textContent = 'Backend not configured';
    leaderboardStatus.style.display = 'block';
  }

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

  // Track drops and multipliers for leaderboard submission
  eventBus.on(GameEventType.PUCK_DROPPED, () => {
    dropsUsed++;
  });

  eventBus.on(GameEventType.PUCK_LANDED, (event) => {
    const payload = event.payload as any;
    if (payload && payload.value > maxMultiplier) {
      maxMultiplier = payload.value;
    }
  });

  eventBus.on(GameEventType.GAME_OVER, () => {
    playButton.disabled = true;
    // Show score submission modal instead of just a message
    if (leaderboard) {
      finalScoreEl.textContent = String(gameState.score);
      submitResult.style.display = 'none';
      playerNameInput.value = '';
      scoreModal.style.display = 'flex';
    } else {
      showMessage('Game Over! Click "New Game" to play again.', 'warning');
    }
  });

  eventBus.on(GameEventType.GAME_RESET, () => {
    hideMessage();
    scoreModal.style.display = 'none';
    playButton.disabled = false;
    dropsUsed = 0;
    maxMultiplier = 0;
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

  // ─── Leaderboard Modal Handlers ──────────────────────────

  submitScoreBtn.addEventListener('click', async () => {
    const name = playerNameInput.value.trim();
    if (!name) {
      playerNameInput.focus();
      return;
    }
    submitScoreBtn.disabled = true;
    submitScoreBtn.textContent = 'Submitting...';

    if (leaderboard) {
      const result = await leaderboard.submitScore(name, gameState.score, maxMultiplier, dropsUsed);
      if (result && result.success) {
        submitResult.textContent = result.message;
        submitResult.className = 'modal-result success';
        submitResult.style.display = 'block';
        // Refresh leaderboard
        const entries = await leaderboard.getLeaderboard();
        renderLeaderboard(entries);
        setTimeout(() => {
          scoreModal.style.display = 'none';
        }, 2000);
      } else {
        submitResult.textContent = 'Failed to submit. Try again.';
        submitResult.className = 'modal-result error';
        submitResult.style.display = 'block';
      }
    }

    submitScoreBtn.disabled = false;
    submitScoreBtn.textContent = 'Submit Score';
  });

  skipScoreBtn.addEventListener('click', () => {
    scoreModal.style.display = 'none';
    showMessage('Game Over! Click "New Game" to play again.', 'warning');
  });

  playerNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      submitScoreBtn.click();
    }
  });

  // ─── Start the Game ─────────────────────────────────────
  game.start();
}

// ─── Entry Point ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', bootstrap);
