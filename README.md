# Plinko Game

A browser-based Plinko game built with **TypeScript** and **HTML5 Canvas**, following **Clean Architecture** principles and common design patterns. Features a **real-time leaderboard** powered by an **AWS Serverless** backend.

Drop pucks from the top of the board and watch them bounce off pegs into scoring slots. Land on high-value slots to maximize your balance — then submit your score to the global leaderboard!

---

## Features

- Real-time physics simulation (gravity, bounce, friction)
- Particle effects on peg collisions and slot landings
- Animated score popups and peg glow effects
- Puck trail rendering
- Color-coded slots by value
- Keyboard support (`Space` to drop)
- Responsive modern UI
- **Global leaderboard** with real-time updates via WebSocket
- **Anti-cheat** score validation (checksum, rate limiting, score sanity checks)

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
│   ├── game-state.ts        Score & state management
│   └── leaderboard-service.ts  HTTP + WebSocket client for backend
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

backend/                ← AWS Lambda handlers (SAM)
├── src/
│   ├── handlers/
│   │   ├── submit-score.ts      POST /scores — validate & store
│   │   ├── get-leaderboard.ts   GET /scores — top N scores
│   │   ├── ws-connect.ts        WebSocket $connect
│   │   └── ws-disconnect.ts     WebSocket $disconnect
│   ├── lib/
│   │   ├── dynamo.ts            DynamoDB CRUD operations
│   │   └── response.ts          API response helpers + CORS
│   └── shared/
│       └── types.ts             Shared types & checksum
├── package.json
└── tsconfig.json

template.yaml           ← AWS SAM template (IaC)
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
git clone https://github.com/MfundoMvuna/plinko-game-assessment.git
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

## AWS Serverless Backend

The leaderboard is powered by a fully serverless AWS stack, defined as Infrastructure-as-Code using **AWS SAM**.

### Architecture

```
┌─────────────┐     HTTPS      ┌──────────────┐     ┌───────────────┐
│   Browser   │◄──────────────►│  HTTP API GW  │────►│ Submit Score  │
│  (Canvas +  │                │   /scores     │     │   Lambda      │──┐
│  Leaderboard)│               └──────────────┘     └───────────────┘  │
│             │                                                        ▼
│             │     WSS        ┌──────────────┐     ┌───────────────┐ ┌────────────┐
│             │◄──────────────►│ WebSocket GW  │────►│ Connect /     │ │ DynamoDB   │
│             │                │  $connect     │     │ Disconnect    │ │ Leaderboard│
└─────────────┘                │  $disconnect  │     │   Lambdas     │ │ Connections│
                               └──────────────┘     └───────────────┘ └────────────┘
```

### Services

| Service            | Purpose                                                    |
| ------------------ | ---------------------------------------------------------- |
| **API Gateway**    | HTTP API (`/scores` GET/POST) + WebSocket API              |
| **Lambda** (x4)    | Submit score, get leaderboard, WS connect, WS disconnect   |
| **DynamoDB** (x2)  | `LeaderboardTable` (scores), `ConnectionsTable` (WS conns) |
| **CloudWatch**     | Automatic logging for all Lambda invocations               |

### Anti-Cheat Validation

- **Checksum**: Scores include a hash of `playerName:score:dropsUsed:salt` — server recomputes and rejects mismatches
- **Rate Limiting**: Max 10 submissions per minute per IP
- **Score Sanity**: Maximum score capped at 500 (prevents impossibly high values)

### Deploy the Backend

#### Prerequisites

- [AWS CLI](https://aws.amazon.com/cli/) configured with credentials
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)

#### Steps

```bash
# 1. Install backend dependencies
cd backend
npm install

# 2. Build & deploy with SAM
cd ..
sam build
sam deploy --guided
```

SAM will prompt for a stack name (e.g., `plinko-backend`) and region. After deployment, it outputs:

- `HttpApiUrl` — your REST endpoint (e.g., `https://abc123.execute-api.us-east-1.amazonaws.com/dev`)
- `WebSocketUrl` — your WebSocket URL (e.g., `wss://xyz789.execute-api.us-east-1.amazonaws.com/dev`)

#### Connect Frontend to Backend

Update the configuration constants in `src/main-new.ts`:

```typescript
const API_URL = 'https://abc123.execute-api.us-east-1.amazonaws.com/dev';
const WS_URL = 'wss://xyz789.execute-api.us-east-1.amazonaws.com/dev';
```

Then rebuild: `npm run build`

---

## Tech Stack

| Technology       | Purpose                     |
| ---------------- | --------------------------- |
| TypeScript       | Type-safe game + backend    |
| HTML5 Canvas     | Game rendering              |
| Webpack          | Frontend bundling           |
| lite-server      | Local dev server            |
| Vercel           | Frontend hosting            |
| AWS Lambda       | Serverless compute          |
| DynamoDB         | NoSQL leaderboard storage   |
| API Gateway      | HTTP + WebSocket APIs       |
| AWS SAM          | Infrastructure-as-Code      |

---

## License

ISC
