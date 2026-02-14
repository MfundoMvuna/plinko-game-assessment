using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using PlinkoApi.Services;

namespace PlinkoApi.Functions;

/// <summary>
/// WebSocket $connect — Save the connection ID in DynamoDB.
/// </summary>
public class WebSocketConnectFunction
{
    private readonly IDynamoDbService _db;

    public WebSocketConnectFunction()
    {
        var client = new Amazon.DynamoDBv2.AmazonDynamoDBClient();
        _db = new DynamoDbService(client);
    }

    public WebSocketConnectFunction(IDynamoDbService db) => _db = db;

    public async Task<APIGatewayProxyResponse> Handler(
        APIGatewayProxyRequest request,
        ILambdaContext context)
    {
        var connectionId = request.RequestContext.ConnectionId;
        context.Logger.LogInformation($"WebSocket connected: {connectionId}");

        await _db.SaveConnectionAsync(connectionId);

        return new APIGatewayProxyResponse { StatusCode = 200, Body = "Connected" };
    }
}
