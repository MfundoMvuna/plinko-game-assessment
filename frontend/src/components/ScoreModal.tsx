'use client';

import { useState, useRef } from 'react';
import { LeaderboardService } from '@/services/leaderboard-service';

interface ScoreModalProps {
  finalScore: number;
  dropsUsed: number;
  maxMultiplier: number;
  apiUrl: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function ScoreModal({
  finalScore,
  dropsUsed,
  maxMultiplier,
  apiUrl,
  onClose,
  onSubmitted,
}: ScoreModalProps) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);
  const svcRef = useRef(new LeaderboardService(apiUrl, null));

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setSubmitting(true);
    const res = await svcRef.current.submitScore(
      trimmed,
      finalScore,
      maxMultiplier,
      dropsUsed,
    );

    if (res?.success) {
      setResult({ text: res.message, type: 'success' });
      onSubmitted();
    } else {
      setResult({ text: 'Failed to submit. Try again.', type: 'error' });
    }
    setSubmitting(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="modal-title">Game Over!</h2>
        <p className="modal-score">
          Final Score: <strong>{finalScore}</strong>
        </p>

        <div className="modal-form">
          <label htmlFor="playerNameInput" className="modal-label">
            Enter your name for the leaderboard:
          </label>
          <input
            id="playerNameInput"
            type="text"
            className="modal-input"
            placeholder="Your Name"
            maxLength={20}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />

          <div className="modal-buttons">
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Score'}
            </button>
            <button className="btn btn-secondary" onClick={onClose}>
              Skip
            </button>
          </div>

          {result && (
            <p className={`modal-result ${result.type}`}>{result.text}</p>
          )}
        </div>
      </div>
    </div>
  );
}
