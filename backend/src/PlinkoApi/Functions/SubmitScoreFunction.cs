using System.Text.Json;
using Amazon.ApiGatewayManagementApi;
using Amazon.ApiGatewayManagementApi.Model;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using PlinkoApi.Models;
using PlinkoApi.Services;

namespace PlinkoApi.Functions;

/// <summary>
/// POST /scores — Validate and store a submitted score.
/// Broadcasts the update to all WebSocket clients.
/// </summary>
public class SubmitScoreFunction
{
    private readonly IDynamoDbService _db;
    private readonly IChecksumService _checksum;
    private const int MaxScore = 500;
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public SubmitScoreFunction()
    {
        var client = new Amazon.DynamoDBv2.AmazonDynamoDBClient();
        _db = new DynamoDbService(client);
        _checksum = new ChecksumService();
    }

    public SubmitScoreFunction(IDynamoDbService db, IChecksumService checksum)
    {
        _db = db;
        _checksum = checksum;
    }

    public async Task<APIGatewayHttpApiV2ProxyResponse> Handler(
        APIGatewayHttpApiV2ProxyRequest request,
        ILambdaContext context)
    {
        if (string.IsNullOrEmpty(request.Body))
            return ApiResponse.BadRequest("Missing request body");

        SubmitScoreRequest? body;
        try
        {
            body = JsonSerializer.Deserialize<SubmitScoreRequest>(request.Body, JsonOpts);
        }
        catch
        {
            return ApiResponse.BadRequest("Invalid JSON");
        }

        if (body is null || string.IsNullOrWhiteSpace(body.PlayerName))
            return ApiResponse.BadRequest("playerName is required");

        if (body.Score < 0 || body.Score > MaxScore)
            return ApiResponse.BadRequest($"Score must be between 0 and {MaxScore}");

        // Anti-cheat: validate checksum
        if (!_checksum.Validate(body.PlayerName, body.Score, body.DropsUsed, body.Checksum))
        {
            context.Logger.LogWarning($"Checksum validation failed for {body.PlayerName}");
            return ApiResponse.Forbidden("Invalid score checksum");
        }

        // Create entry
        var entry = new LeaderboardEntry
        {
            PlayerName = body.PlayerName.Trim()[..Math.Min(body.PlayerName.Trim().Length, 20)],
            Score = body.Score,
            MaxMultiplier = body.MaxMultiplier,
            DropsUsed = body.DropsUsed,
            Timestamp = DateTime.UtcNow.ToString("O"),
        };

        await _db.PutScoreAsync(entry);
        context.Logger.LogInformation($"Score saved: {entry.PlayerName} = {entry.Score}");

        var rank = await _db.GetScoreRankAsync(entry.Score);

        // Broadcast to WebSocket clients
        await BroadcastNewScoreAsync(entry, context);

        var response = new SubmitScoreResponse
        {
            Success = true,
            Rank = rank,
            Message = $"Score submitted! You ranked #{rank}",
            Entry = entry,
        };

        return ApiResponse.Ok(response, 201);
    }

    private async Task BroadcastNewScoreAsync(LeaderboardEntry entry, ILambdaContext context)
    {
        var wsEndpoint = Environment.GetEnvironmentVariable("WEBSOCKET_ENDPOINT");
        if (string.IsNullOrEmpty(wsEndpoint)) return;

        try
        {
            var connectionIds = await _db.GetAllConnectionIdsAsync();
            if (connectionIds.Count == 0) return;

            using var apiClient = new AmazonApiGatewayManagementApiClient(
                new AmazonApiGatewayManagementApiConfig { ServiceURL = wsEndpoint });

            var message = new WebSocketMessage
            {
                Type = "new:highscore",
                Payload = entry,
            };
            var data = JsonSerializer.SerializeToUtf8Bytes(message, JsonOpts);

            var tasks = connectionIds.Select(async connId =>
            {
                try
                {
                    await apiClient.PostToConnectionAsync(new PostToConnectionRequest
                    {
                        ConnectionId = connId,
                        Data = new MemoryStream(data),
                    });
                }
                catch (GoneException)
                {
                    await _db.RemoveConnectionAsync(connId);
                }
                catch (Exception ex)
                {
                    context.Logger.LogWarning($"Failed to send to {connId}: {ex.Message}");
                }
            });

            await Task.WhenAll(tasks);
        }
        catch (Exception ex)
        {
            context.Logger.LogWarning($"Broadcast failed: {ex.Message}");
        }
    }
}
