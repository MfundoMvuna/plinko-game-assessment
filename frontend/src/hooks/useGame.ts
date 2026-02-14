'use client';

import { useEffect, useRef, useState, useCallback, RefObject } from 'react';
import { DIContainer, ServiceTokens } from '@/game/core/di-container';
import { EventBus } from '@/game/core/event-bus';
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
} from '@/game/core/interfaces';
import { CanvasRenderer } from '@/game/services/renderer';
import { PhysicsEngine } from '@/game/services/physics-engine';
import { GameStateManager } from '@/game/services/game-state';
import { ParticleSystem } from '@/game/services/particle-system';
import { PegFactory } from '@/game/factories/peg-factory';
import { PuckFactory } from '@/game/factories/puck-factory';
import { SlotFactory } from '@/game/factories/slot-factory';
import { Game } from '@/game/engine/game';

interface UseGameReturn {
  score: number;
  canDrop: boolean;
  isGameOver: boolean;
  gameOverScore: number;
  dropsUsed: number;
  maxMultiplier: number;
  dropPuck: () => boolean;
  resetGame: () => void;
}

/**
 * Custom hook that bootstraps the Plinko game engine inside a canvas ref.
 * Replaces the old main-new.ts composition root with React-friendly state.
 */
export function useGame(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  showMessage: (text: string, type: 'info' | 'warning') => void,
): UseGameReturn {
  const gameRef = useRef<Game | null>(null);
  const gameStateRef = useRef<IGameState | null>(null);
  const [score, setScore] = useState(100);
  const [canDrop, setCanDrop] = useState(true);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOverScore, setGameOverScore] = useState(0);
  const dropsRef = useRef(0);
  const maxMultRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 800;
    canvas.height = 600;

    // ─── DI Container ──────────────────────────────────────
    const container = new DIContainer();

    container.registerSingleton<IEventBus>(
      ServiceTokens.EventBus,
      () => new EventBus(),
    );
    container.registerSingleton<IRenderer>(
      ServiceTokens.Renderer,
      () => new CanvasRenderer(canvas),
    );
    container.registerSingleton<IPhysicsEngine>(
      ServiceTokens.PhysicsEngine,
      () => new PhysicsEngine(0.15, 0.998, 0.6, 0.7),
    );
    container.registerSingleton<IGameState>(ServiceTokens.GameState, () => {
      const eb = container.resolve<IEventBus>(ServiceTokens.EventBus);
      return new GameStateManager(eb, 100, 10);
    });
    container.registerSingleton<IParticleSystem>(
      ServiceTokens.ParticleSystem,
      () => new ParticleSystem(),
    );
    container.registerSingleton<IPegFactory>(
      ServiceTokens.PegFactory,
      () => new PegFactory(),
    );
    container.registerSingleton<IPuckFactory>(
      ServiceTokens.PuckFactory,
      () => new PuckFactory(),
    );
    container.registerSingleton<ISlotFactory>(
      ServiceTokens.SlotFactory,
      () => new SlotFactory(),
    );
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

    // ─── Resolve ────────────────────────────────────────────
    const eventBus = container.resolve<IEventBus>(ServiceTokens.EventBus);
    const gameState = container.resolve<IGameState>(ServiceTokens.GameState);
    const game = container.resolve<Game>(ServiceTokens.Game);

    gameRef.current = game;
    gameStateRef.current = gameState;

    // ─── Subscribe to events ────────────────────────────────
    eventBus.on(GameEventType.SCORE_CHANGED, (event) => {
      const payload = event.payload as IScoreChangedPayload;
      setScore(payload.newScore);
      setCanDrop(gameState.canDrop());
    });

    eventBus.on(GameEventType.PUCK_DROPPED, () => {
      dropsRef.current++;
    });

    eventBus.on(GameEventType.PUCK_LANDED, (event) => {
      const payload = event.payload as { value?: number } | undefined;
      if (payload?.value && payload.value > maxMultRef.current) {
        maxMultRef.current = payload.value;
      }
    });

    eventBus.on(GameEventType.GAME_OVER, () => {
      setCanDrop(false);
      setIsGameOver(true);
      setGameOverScore(gameState.score);
    });

    eventBus.on(GameEventType.GAME_RESET, () => {
      setScore(gameState.score);
      setCanDrop(true);
      setIsGameOver(false);
      dropsRef.current = 0;
      maxMultRef.current = 0;
    });

    // ─── Keyboard shortcut ──────────────────────────────────
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (!game.dropPuck()) {
          showMessage('Not enough balance! Start a new game.', 'warning');
        }
      }
    };
    document.addEventListener('keydown', handleKey);

    // ─── Start ──────────────────────────────────────────────
    game.start();

    return () => {
      document.removeEventListener('keydown', handleKey);
      // Game uses requestAnimationFrame — it will stop when references are GC'd
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dropPuck = useCallback((): boolean => {
    return gameRef.current?.dropPuck() ?? false;
  }, []);

  const resetGame = useCallback(() => {
    gameRef.current?.reset();
  }, []);

  return {
    score,
    canDrop,
    isGameOver,
    gameOverScore,
    dropsUsed: dropsRef.current,
    maxMultiplier: maxMultRef.current,
    dropPuck,
    resetGame,
  };
}
