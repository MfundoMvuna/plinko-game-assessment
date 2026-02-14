namespace PlinkoApi.Models;

public class LeaderboardEntry
{
    public string PlayerName { get; set; } = string.Empty;
    public int Score { get; set; }
    public double MaxMultiplier { get; set; }
    public int DropsUsed { get; set; }
    public string Timestamp { get; set; } = string.Empty;
}

public class SubmitScoreRequest
{
    public string PlayerName { get; set; } = string.Empty;
    public int Score { get; set; }
    public double MaxMultiplier { get; set; }
    public int DropsUsed { get; set; }
    public string Checksum { get; set; } = string.Empty;
}

public class SubmitScoreResponse
{
    public bool Success { get; set; }
    public int? Rank { get; set; }
    public string Message { get; set; } = string.Empty;
    public LeaderboardEntry? Entry { get; set; }
}

public class GetLeaderboardResponse
{
    public List<LeaderboardEntry> Entries { get; set; } = [];
    public int Total { get; set; }
}

public class WebSocketMessage
{
    public string Type { get; set; } = string.Empty;
    public object? Payload { get; set; }
}
