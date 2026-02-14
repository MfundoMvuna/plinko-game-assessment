using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DocumentModel;
using Amazon.DynamoDBv2.Model;
using PlinkoApi.Models;

namespace PlinkoApi.Services;

public interface IDynamoDbService
{
    Task PutScoreAsync(LeaderboardEntry entry);
    Task<List<LeaderboardEntry>> GetTopScoresAsync(int limit = 25);
    Task<int> GetScoreRankAsync(int score);
    Task SaveConnectionAsync(string connectionId);
    Task RemoveConnectionAsync(string connectionId);
    Task<List<string>> GetAllConnectionIdsAsync();
}

public class DynamoDbService : IDynamoDbService
{
    private readonly IAmazonDynamoDB _client;
    private readonly string _leaderboardTable;
    private readonly string _connectionsTable;

    public DynamoDbService(IAmazonDynamoDB client)
    {
        _client = client;
        _leaderboardTable = Environment.GetEnvironmentVariable("LEADERBOARD_TABLE")
            ?? throw new InvalidOperationException("LEADERBOARD_TABLE not set");
        _connectionsTable = Environment.GetEnvironmentVariable("CONNECTIONS_TABLE")
            ?? throw new InvalidOperationException("CONNECTIONS_TABLE not set");
    }

    public async Task PutScoreAsync(LeaderboardEntry entry)
    {
        var item = new Dictionary<string, AttributeValue>
        {
            ["pk"] = new() { S = $"SCORE#{entry.Score:D10}#{entry.Timestamp}" },
            ["playerName"] = new() { S = entry.PlayerName },
            ["score"] = new() { N = entry.Score.ToString() },
            ["maxMultiplier"] = new() { N = entry.MaxMultiplier.ToString("F2") },
            ["dropsUsed"] = new() { N = entry.DropsUsed.ToString() },
            ["timestamp"] = new() { S = entry.Timestamp },
        };

        await _client.PutItemAsync(new PutItemRequest
        {
            TableName = _leaderboardTable,
            Item = item,
        });
    }

    public async Task<List<LeaderboardEntry>> GetTopScoresAsync(int limit = 25)
    {
        // Scan and sort — for a game leaderboard this is fine.
        // For production scale, use a GSI with inverted score.
        var response = await _client.ScanAsync(new ScanRequest
        {
            TableName = _leaderboardTable,
            Limit = 500,
        });

        var entries = response.Items
            .Select(MapToEntry)
            .OrderByDescending(e => e.Score)
            .ThenBy(e => e.Timestamp)
            .Take(limit)
            .ToList();

        return entries;
    }

    public async Task<int> GetScoreRankAsync(int score)
    {
        var all = await GetTopScoresAsync(100);
        var rank = all.FindIndex(e => e.Score <= score);
        return rank < 0 ? all.Count + 1 : rank + 1;
    }

    public async Task SaveConnectionAsync(string connectionId)
    {
        var ttl = DateTimeOffset.UtcNow.AddHours(24).ToUnixTimeSeconds();

        await _client.PutItemAsync(new PutItemRequest
        {
            TableName = _connectionsTable,
            Item = new Dictionary<string, AttributeValue>
            {
                ["connectionId"] = new() { S = connectionId },
                ["ttl"] = new() { N = ttl.ToString() },
            },
        });
    }

    public async Task RemoveConnectionAsync(string connectionId)
    {
        await _client.DeleteItemAsync(new DeleteItemRequest
        {
            TableName = _connectionsTable,
            Key = new Dictionary<string, AttributeValue>
            {
                ["connectionId"] = new() { S = connectionId },
            },
        });
    }

    public async Task<List<string>> GetAllConnectionIdsAsync()
    {
        var response = await _client.ScanAsync(new ScanRequest
        {
            TableName = _connectionsTable,
            ProjectionExpression = "connectionId",
        });

        return response.Items
            .Select(item => item["connectionId"].S)
            .ToList();
    }

    private static LeaderboardEntry MapToEntry(Dictionary<string, AttributeValue> item)
    {
        return new LeaderboardEntry
        {
            PlayerName = item.GetValueOrDefault("playerName")?.S ?? "Unknown",
            Score = int.TryParse(item.GetValueOrDefault("score")?.N, out var s) ? s : 0,
            MaxMultiplier = double.TryParse(item.GetValueOrDefault("maxMultiplier")?.N, out var m) ? m : 0,
            DropsUsed = int.TryParse(item.GetValueOrDefault("dropsUsed")?.N, out var d) ? d : 0,
            Timestamp = item.GetValueOrDefault("timestamp")?.S ?? "",
        };
    }
}
