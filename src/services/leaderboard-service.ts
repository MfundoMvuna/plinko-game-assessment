/**
 * Shared checksum — duplicated from backend for frontend use.
 * In a monorepo, you'd import from a shared package.
 */
export function generateChecksum(
  playerName: string,
  score: number,
  dropsUsed: number,
): string {
  const raw = `${playerName}:${score}:${dropsUsed}:plinko-salt-2026`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(36);
}

export interface LeaderboardEntry {
  playerName: string;
  score: number;
  maxMultiplier: number;
  dropsUsed: number;
  timestamp: string;
}

export interface SubmitScoreResponse {
  success: boolean;
  rank?: number;
  message: string;
  entry?: LeaderboardEntry;
}

export interface GetLeaderboardResponse {
  entries: LeaderboardEntry[];
  total: number;
}

/**
 * LeaderboardService — Communicates with the AWS backend.
 * Handles HTTP requests and WebSocket real-time updates.
 */
export class LeaderboardService {
  private readonly apiUrl: string;
  private readonly wsUrl: string | null;
  private ws: WebSocket | null = null;
  private onUpdateCallback: ((entries: LeaderboardEntry[]) => void) | null = null;
  private onNewScoreCallback: ((entry: LeaderboardEntry) => void) | null = null;

  constructor(apiUrl: string, wsUrl: string | null = null) {
    // Remove trailing slash
    this.apiUrl = apiUrl.replace(/\/$/, '');
    this.wsUrl = wsUrl;
  }

  /** Fetch the top scores */
  async getLeaderboard(limit: number = 25): Promise<LeaderboardEntry[]> {
    try {
      const response = await fetch(`${this.apiUrl}/scores?limit=${limit}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: GetLeaderboardResponse = await response.json();
      return data.entries;
    } catch (err) {
      console.warn('Failed to fetch leaderboard:', err);
      return [];
    }
  }

  /** Submit a score */
  async submitScore(
    playerName: string,
    score: number,
    maxMultiplier: number,
    dropsUsed: number,
  ): Promise<SubmitScoreResponse | null> {
    try {
      const checksum = generateChecksum(playerName, score, dropsUsed);
      const response = await fetch(`${this.apiUrl}/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName,
          score,
          maxMultiplier,
          dropsUsed,
          checksum,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.warn('Score submission failed:', errData);
        return null;
      }

      return await response.json();
    } catch (err) {
      console.warn('Failed to submit score:', err);
      return null;
    }
  }

  /** Connect to WebSocket for real-time leaderboard updates */
  connectWebSocket(): void {
    if (!this.wsUrl) return;

    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'leaderboard:update' && this.onUpdateCallback) {
            this.onUpdateCallback(message.payload);
          }
          if (message.type === 'new:highscore' && this.onNewScoreCallback) {
            this.onNewScoreCallback(message.payload);
          }
        } catch (err) {
          console.warn('WebSocket message parse error:', err);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected, reconnecting in 5s...');
        setTimeout(() => this.connectWebSocket(), 5000);
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket error:', err);
      };
    } catch (err) {
      console.warn('WebSocket connection failed:', err);
    }
  }

  /** Register callback for leaderboard updates */
  onLeaderboardUpdate(callback: (entries: LeaderboardEntry[]) => void): void {
    this.onUpdateCallback = callback;
  }

  /** Register callback for new high scores */
  onNewHighScore(callback: (entry: LeaderboardEntry) => void): void {
    this.onNewScoreCallback = callback;
  }

  /** Disconnect WebSocket */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
