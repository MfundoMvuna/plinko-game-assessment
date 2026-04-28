# 🎯 Plinko Game — Real-Time Physics + Serverless Leaderboard

A **browser-based Plinko game** built with TypeScript and HTML5 Canvas, featuring a **real-time multiplayer leaderboard powered by AWS serverless infrastructure**.

This project focuses on **clean architecture, scalable backend design, and interactive physics simulation**.

---

## 🚀 Live Demo

👉 https://plinko-game-assessment-git-main-mfundos-projects.vercel.app

---

## 🧠 What This Project Demonstrates

* Real-time game physics simulation
* Clean Architecture in a frontend-heavy application
* Serverless backend design (AWS Lambda + WebSockets)
* Anti-cheat validation strategies
* Event-driven system design

---

## 🏗️ Architecture Overview

### Frontend (Game Engine)

```id="plk1"
[ Game Loop ]
     ↓
[ Physics Engine ] ← Strategy Pattern
     ↓
[ Renderer (Canvas) ]
     ↓
[ Event Bus ] ← Observer Pattern
     ↓
[ Game State + UI ]
```

---

### Backend (Serverless Leaderboard)

```id="plk2"
Browser
   ↓
API Gateway (HTTP + WebSocket)
   ↓
Lambda Functions
   ├── Submit Score
   ├── Get Leaderboard
   ├── WS Connect / Disconnect
   ↓
DynamoDB (Scores + Connections)
```

---

## 🛠️ Tech Stack

**Frontend**

* TypeScript
* HTML5 Canvas
* Webpack

**Backend**

* AWS Lambda (C#)
* API Gateway (HTTP + WebSocket)
* DynamoDB

**Infrastructure**

* AWS SAM (Infrastructure as Code)
* Vercel (frontend hosting)

---

## ✨ Core Features

### 🎮 Game Engine

* Realistic physics (gravity, bounce, friction)
* Particle effects and animations
* Dynamic scoring system
* Keyboard + UI controls

### 🌐 Real-Time Leaderboard

* Live updates via WebSockets
* Global score tracking
* Persistent storage (DynamoDB)

### 🔐 Anti-Cheat System

* Score checksum validation
* Rate limiting (per IP)
* Score sanity caps

---

## 🧩 Design Patterns Used

| Pattern              | Purpose                      |
| -------------------- | ---------------------------- |
| Dependency Injection | Decoupled system composition |
| Observer (Event Bus) | Event-driven communication   |
| Strategy             | Swappable physics engine     |
| Factory              | Controlled entity creation   |
| SRP                  | Clean, maintainable classes  |

---

## ⚙️ DevOps & Infrastructure

* Fully serverless backend using AWS SAM
* WebSocket + REST APIs via API Gateway
* DynamoDB for scalable storage
* CloudWatch logging for observability

---

## 🧪 Local Development

```bash id="plk3"
git clone https://github.com/MfundoMvuna/plinko-game-assessment.git
cd plinko-game-assessment
npm install
npm run dev
```

Runs at: http://localhost:3000

---

## 🚀 Deployment

### Frontend (Vercel)

* Auto-deploy from GitHub
* Static asset caching configured

### Backend (AWS)

```bash id="plk4"
cd backend
npm install
cd ..
sam build
sam deploy --guided
```

---

## 🔑 Key Design Decisions

* **Canvas over DOM** → better performance for physics rendering
* **Serverless backend** → scalable and cost-efficient
* **WebSockets** → real-time leaderboard updates
* **Checksum validation** → prevents client-side score tampering

---

## 🚧 Future Improvements

* Multiplayer gameplay (real-time competition)
* Mobile optimization
* Leaderboard tiers / ranking system
* Replay system for top scores

---

## 👨‍💻 Author

**Mfundo Mvuna**

---

## ⭐ Final Note

This project highlights:

* Strong understanding of **frontend architecture patterns**
* Ability to design **real-time systems**
* Experience with **serverless cloud infrastructure**
* Focus on **clean, maintainable code**

---
