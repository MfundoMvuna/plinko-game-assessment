# Plinko Game

A browser-based Plinko game built with **TypeScript** and **HTML5 Canvas**, following **Clean Architecture** principles and common design patterns.

Drop pucks from the top of the board and watch them bounce off pegs into scoring slots. Land on high-value slots to maximize your balance!

---

## Features

- Real-time physics simulation (gravity, bounce, friction)
- Particle effects on peg collisions and slot landings
- Animated score popups and peg glow effects
- Puck trail rendering
- Color-coded slots by value
- Keyboard support (`Space` to drop)
- Responsive modern UI

---

## Architecture

The project follows **Clean Architecture** with clear separation of concerns:

```
src/
├── core/               ← Domain layer (interfaces, event bus, DI container)
│   ├── interfaces.ts       All contracts / abstractions
│   ├── event-bus.ts         Observer pattern implementation
│   └── di-container.ts      Dependency injection container
│
├── entities/           ← Game entities (pure domain objects)
│   ├── peg.ts
│   ├── puck.ts
│   ├── slot.ts
│   └── particle.ts
│
├── services/           ← Application services
│   ├── physics-engine.ts    Strategy pattern — pluggable physics
│   ├── renderer.ts          Canvas rendering abstraction
│   ├── particle-system.ts   Particle lifecycle manager
│   └── game-state.ts        Score & state management
│
├── factories/          ← Factory pattern — entity creation
│   ├── peg-factory.ts
│   ├── puck-factory.ts
│   └── slot-factory.ts
│
├── game/               ← Application orchestrator
│   └── game.ts              Coordinates all services
│
└── main-new.ts         ← Composition root (DI wiring & bootstrap)
```

### Design Patterns Used

| Pattern                  | Where                          | Why                                                        |
| ------------------------ | ------------------------------ | ---------------------------------------------------------- |
| **Dependency Injection** | `DIContainer` + `main-new.ts`  | All dependencies wired at the composition root             |
| **Observer**             | `EventBus`                     | Decoupled communication (score changes, game over, etc.)   |
| **Strategy**             | `IPhysicsEngine` interface     | Physics engine is swappable without touching game logic     |
| **Factory**              | `PegFactory`, `PuckFactory`... | Encapsulates entity creation and board layout               |
| **Single Responsibility**| Every class                    | Each class has one job — orchestrate, render, or calculate |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later)
- npm (comes with Node.js)

### Clone & Install

```bash
git clone https://github.com/<your-username>/plinko-game-assessment.git
cd plinko-game-assessment
npm install
```

### Build

```bash
npm run build
```

This compiles TypeScript → JavaScript and bundles everything into `dist/bundle.js`.

### Run Locally

```bash
npm start
```

This starts a development server (via [lite-server](https://github.com/nicosabena/lite-server)) and opens the game in your browser at **http://localhost:3000**.

### Development Workflow

```bash
# Build in development mode + start server
npm run dev
```

---

## How to Play

1. Click **Drop Puck** (or press `Space`) to release a puck
2. Each drop costs **10** from your balance (starting balance: **100**)
3. The puck bounces off pegs and lands in a scoring slot
4. Slot values: `0x`, `1x`, `2x`, `5x`, `10x` — the edges pay the most!
5. When your balance runs out, click **New Game** to restart

---

## Deploy to Vercel

This project is pre-configured for Vercel deployment.

### Option 1: Import via Vercel Dashboard

1. Push your code to a GitHub/GitLab/Bitbucket repository
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Vercel will auto-detect the settings from `vercel.json` — just click **Deploy**

### Option 2: Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Vercel Configuration

The included `vercel.json` handles:

- **Build command**: `npm run build` (uses `npx webpack` to avoid permission issues)
- **Output directory**: `.` (serves `index.html`, `styles.css`, and `dist/` from the project root)
- **Caching**: Static assets (`dist/`, CSS) are cached with long-lived headers

---

## Tech Stack

| Technology  | Purpose              |
| ----------- | -------------------- |
| TypeScript  | Type-safe game logic |
| HTML5 Canvas| Rendering            |
| Webpack     | Bundling             |
| lite-server | Local dev server     |
| Vercel      | Hosting              |

---

## License

ISC
