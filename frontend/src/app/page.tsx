'use client';

import { useRef, useState, useCallback } from 'react';
import { useGame } from '@/hooks/useGame';
import GameCanvas from '@/components/GameCanvas';
import GameControls from '@/components/GameControls';
import Leaderboard from '@/components/Leaderboard';
import ScoreModal from '@/components/ScoreModal';

// ─── Configuration ──────────────────────────────────────────
// Set these after deploying your SAM backend:
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || '';

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [message, setMessage] = useState<{
    text: string;
    type: 'info' | 'warning';
  } | null>(null);

  const showMessage = useCallback(
    (text: string, type: 'info' | 'warning' = 'info') => {
      setMessage({ text, type });
      setTimeout(() => setMessage(null), 3000);
    },
    [],
  );

  const {
    score,
    canDrop,
    isGameOver,
    gameOverScore,
    dropsUsed,
    maxMultiplier,
    dropPuck,
    resetGame,
  } = useGame(canvasRef, showMessage);

  const handleDrop = useCallback(() => {
    if (!dropPuck()) {
      showMessage('Not enough balance! Start a new game.', 'warning');
    }
  }, [dropPuck, showMessage]);

  const [showModal, setShowModal] = useState(false);

  // Show modal when game ends (if backend configured)
  const prevGameOver = useRef(false);
  if (isGameOver && !prevGameOver.current) {
    prevGameOver.current = true;
    if (API_URL) {
      // defer to avoid setState during render
      setTimeout(() => setShowModal(true), 0);
    } else {
      setTimeout(
        () => showMessage('Game Over! Click "New Game" to play again.', 'warning'),
        0,
      );
    }
  }
  if (!isGameOver && prevGameOver.current) {
    prevGameOver.current = false;
  }

  const handleReset = useCallback(() => {
    resetGame();
    setShowModal(false);
  }, [resetGame]);

  return (
    <div className="game-wrapper">
      {/* Header */}
      <header className="game-header">
        <h1 className="game-title">
          <span className="title-icon">●</span> Plinko
        </h1>
        <div className="header-info">
          <span className="hint">
            Press <kbd>Space</kbd> to drop
          </span>
        </div>
      </header>

      {/* Game + Leaderboard side-by-side */}
      <div className="game-layout">
        <div className="game-container">
          <GameCanvas ref={canvasRef} />
          {message && (
            <div className={`message ${message.type}`}>{message.text}</div>
          )}
        </div>

        <Leaderboard apiUrl={API_URL} wsUrl={WS_URL} />
      </div>

      {/* Controls */}
      <GameControls
        score={score}
        canDrop={canDrop}
        onDrop={handleDrop}
        onReset={handleReset}
      />

      {/* Score Submission Modal */}
      {showModal && (
        <ScoreModal
          finalScore={gameOverScore}
          dropsUsed={dropsUsed}
          maxMultiplier={maxMultiplier}
          apiUrl={API_URL}
          onClose={() => {
            setShowModal(false);
            showMessage('Game Over! Click "New Game" to play again.', 'warning');
          }}
          onSubmitted={() => {
            setTimeout(() => setShowModal(false), 2000);
          }}
        />
      )}

      {/* Footer */}
      <footer className="game-footer">
        <span>
          Built with <strong>TypeScript</strong>
        </span>
        <span className="separator">·</span>
        <span>Clean Architecture</span>
      </footer>
    </div>
  );
}
