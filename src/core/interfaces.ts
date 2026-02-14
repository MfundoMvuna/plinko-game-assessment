// ============================================================
// Core Interfaces — Contracts for the entire application
// Following Interface Segregation Principle (ISP)
// ============================================================

/** 2D position vector */
export interface IVector2D {
  x: number;
  y: number;
}

/** 2D velocity vector */
export interface IVelocity {
  speedX: number;
  speedY: number;
}

/** Bounding rectangle */
export interface IRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Anything that can be drawn on a canvas */
export interface IRenderable {
  draw(ctx: CanvasRenderingContext2D): void;
}

/** Anything that updates per frame */
export interface IUpdatable {
  update(deltaTime: number): void;
}

// ─── Entity Interfaces ───────────────────────────────────────

export interface IPeg extends IVector2D, IRenderable {
  readonly radius: number;
  readonly color: string;
  glowIntensity: number;
  triggerGlow(): void;
}

export interface IPuck extends IVector2D, IVelocity, IRenderable, IUpdatable {
  readonly radius: number;
  readonly id: string;
  active: boolean;
}

export interface ISlot extends IRect, IRenderable {
  readonly value: number;
  readonly multiplierLabel: string;
  highlight(): void;
  resetColor(): void;
}

export interface IParticle extends IVector2D, IRenderable, IUpdatable {
  alive: boolean;
  life: number;
}

// ─── Service Interfaces ──────────────────────────────────────

/** Physics engine contract (Strategy Pattern) */
export interface IPhysicsEngine {
  applyGravity(puck: IPuck, deltaTime: number): void;
  applyFriction(puck: IPuck): void;
  detectPegCollision(puck: IPuck, pegs: IPeg[]): IPeg | null;
  checkBoundaries(puck: IPuck, canvasWidth: number, canvasHeight: number): void;
  checkSlotCollision(puck: IPuck, slots: ISlot[], canvasHeight: number): ISlot | null;
}

/** Renderer contract */
export interface IRenderer {
  clear(): void;
  drawBackground(): void;
  getContext(): CanvasRenderingContext2D;
  getWidth(): number;
  getHeight(): number;
}

/** Game state manager contract */
export interface IGameState {
  score: number;
  dropCost: number;
  isRunning: boolean;
  canDrop(): boolean;
  deductDropCost(): void;
  addScore(value: number): void;
  reset(): void;
}

/** Particle system contract */
export interface IParticleSystem extends IRenderable, IUpdatable {
  emit(x: number, y: number, color: string, count: number): void;
}

// ─── Event Types ─────────────────────────────────────────────

export enum GameEventType {
  PUCK_DROPPED = 'puck:dropped',
  PUCK_LANDED = 'puck:landed',
  PEG_HIT = 'peg:hit',
  SCORE_CHANGED = 'score:changed',
  GAME_OVER = 'game:over',
  GAME_RESET = 'game:reset',
}

export interface IGameEvent {
  type: GameEventType;
  payload?: unknown;
}

export interface IScoreChangedPayload {
  oldScore: number;
  newScore: number;
}

export interface IPuckLandedPayload {
  puck: IPuck;
  slot: ISlot;
  value: number;
}

export interface IPegHitPayload {
  puck: IPuck;
  peg: IPeg;
}

// ─── Factory Interfaces ──────────────────────────────────────

export interface IPegFactory {
  createPeg(x: number, y: number, radius: number, color: string): IPeg;
  createPegGrid(canvasWidth: number, rows?: number, cols?: number): IPeg[];
}

export interface IPuckFactory {
  createPuck(x: number, y: number, radius: number): IPuck;
}

export interface ISlotFactory {
  createSlot(x: number, y: number, width: number, height: number, value: number): ISlot;
  createSlotRow(canvasWidth: number, canvasHeight: number, values?: number[]): ISlot[];
}

// ─── Event Bus Interface (Observer Pattern) ──────────────────

export type EventHandler = (event: IGameEvent) => void;

export interface IEventBus {
  on(eventType: GameEventType, handler: EventHandler): void;
  off(eventType: GameEventType, handler: EventHandler): void;
  emit(event: IGameEvent): void;
}

// ─── DI Container Interface ─────────────────────────────────

export interface IDIContainer {
  register<T>(token: string, factory: () => T): void;
  registerSingleton<T>(token: string, factory: () => T): void;
  resolve<T>(token: string): T;
}
