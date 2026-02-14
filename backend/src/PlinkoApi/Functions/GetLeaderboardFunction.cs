using System.Text.Json;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using PlinkoApi.Models;
using PlinkoApi.Services;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace PlinkoApi.Functions;

/// <summary>
/// GET /scores — Return top N leaderboard entries.
/// </summary>
public class GetLeaderboardFunction
{
    private readonly IDynamoDbService _db;

    public GetLeaderboardFunction()
    {
        var client = new Amazon.DynamoDBv2.AmazonDynamoDBClient();
        _db = new DynamoDbService(client);
    }

    // Constructor for testing / DI
    public GetLeaderboardFunction(IDynamoDbService db) => _db = db;

    public async Task<APIGatewayHttpApiV2ProxyResponse> Handler(
        APIGatewayHttpApiV2ProxyRequest request,
        ILambdaContext context)
    {
        string? limitStr = null;
        request.QueryStringParameters?.TryGetValue("limit", out limitStr);
        limitStr ??= "25";
        var limit = Math.Clamp(int.TryParse(limitStr, out var l) ? l : 25, 1, 100);

        context.Logger.LogInformation($"GetLeaderboard: limit={limit}");

        var entries = await _db.GetTopScoresAsync(limit);

        var response = new GetLeaderboardResponse
        {
            Entries = entries,
            Total = entries.Count,
        };

        return ApiResponse.Ok(response);
    }
}
