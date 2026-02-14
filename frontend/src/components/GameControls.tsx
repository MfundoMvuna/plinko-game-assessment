'use client';

interface GameControlsProps {
  score: number;
  canDrop: boolean;
  onDrop: () => void;
  onReset: () => void;
}

export default function GameControls({
  score,
  canDrop,
  onDrop,
  onReset,
}: GameControlsProps) {
  return (
    <div className="controls">
      <div className="score-section">
        <span className="score-label">Balance</span>
        <span className="score-value">{score}</span>
      </div>
      <div className="button-group">
        <button
          className="btn btn-primary"
          onClick={onDrop}
          disabled={!canDrop}
        >
          <span className="btn-icon">▼</span> Drop Puck
        </button>
        <button className="btn btn-secondary" onClick={onReset}>
          <span className="btn-icon">↻</span> New Game
        </button>
      </div>
    </div>
  );
}
