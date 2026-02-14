using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using PlinkoApi.Services;

namespace PlinkoApi.Functions;

/// <summary>
/// WebSocket $disconnect — Remove the connection ID from DynamoDB.
/// </summary>
public class WebSocketDisconnectFunction
{
    private readonly IDynamoDbService _db;

    public WebSocketDisconnectFunction()
    {
        var client = new Amazon.DynamoDBv2.AmazonDynamoDBClient();
        _db = new DynamoDbService(client);
    }

    public WebSocketDisconnectFunction(IDynamoDbService db) => _db = db;

    public async Task<APIGatewayProxyResponse> Handler(
        APIGatewayProxyRequest request,
        ILambdaContext context)
    {
        var connectionId = request.RequestContext.ConnectionId;
        context.Logger.LogInformation($"WebSocket disconnected: {connectionId}");

        await _db.RemoveConnectionAsync(connectionId);

        return new APIGatewayProxyResponse { StatusCode = 200, Body = "Disconnected" };
    }
}
