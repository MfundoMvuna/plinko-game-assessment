'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  LeaderboardService,
  LeaderboardEntry,
} from '@/services/leaderboard-service';

interface LeaderboardProps {
  apiUrl: string;
  wsUrl: string;
}

function escapeHtml(str: string): string {
  const el = document.createElement('span');
  el.textContent = str;
  return el.innerHTML;
}

export default function Leaderboard({ apiUrl, wsUrl }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [status, setStatus] = useState<string>('Loading...');
  const serviceRef = useRef<LeaderboardService | null>(null);

  const refresh = useCallback(async () => {
    if (!serviceRef.current) return;
    const data = await serviceRef.current.getLeaderboard();
    setEntries(data);
    setStatus('');
  }, []);

  useEffect(() => {
    if (!apiUrl) {
      setStatus('Backend not configured');
      return;
    }

    const svc = new LeaderboardService(apiUrl, wsUrl || null);
    serviceRef.current = svc;

    svc.getLeaderboard().then((data) => {
      setEntries(data);
      setStatus('');
    });

    if (wsUrl) {
      svc.connectWebSocket();
      svc.onLeaderboardUpdate((data) => setEntries(data));
      svc.onNewHighScore(() => refresh());
    }

    return () => {
      svc.disconnect();
    };
  }, [apiUrl, wsUrl, refresh]);

  return (
    <aside className="leaderboard-panel">
      <h2 className="leaderboard-title">Leaderboard</h2>

      {status && <div className="leaderboard-status">{status}</div>}

      {!status && entries.length === 0 && (
        <div className="leaderboard-empty">No scores yet. Be the first!</div>
      )}

      {entries.length > 0 && (
        <ol className="leaderboard-list">
          {entries.map((e, i) => (
            <li key={`${e.playerName}-${e.score}`} className={`lb-entry${i < 3 ? ' lb-top' : ''}`}>
              <span className="lb-rank">{i + 1}</span>
              <span className="lb-name">{escapeHtml(e.playerName)}</span>
              <span className="lb-score">{e.score}</span>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
