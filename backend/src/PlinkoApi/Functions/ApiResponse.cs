using System.Text.Json;
using Amazon.Lambda.APIGatewayEvents;

namespace PlinkoApi.Functions;

/// <summary>
/// Standard API response helpers with CORS headers.
/// </summary>
public static class ApiResponse
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private static readonly Dictionary<string, string> CorsHeaders = new()
    {
        ["Access-Control-Allow-Origin"] = "*",
        ["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS",
        ["Access-Control-Allow-Headers"] = "Content-Type",
        ["Content-Type"] = "application/json",
    };

    public static APIGatewayHttpApiV2ProxyResponse Ok(object body, int statusCode = 200)
    {
        return new APIGatewayHttpApiV2ProxyResponse
        {
            StatusCode = statusCode,
            Headers = CorsHeaders,
            Body = JsonSerializer.Serialize(body, JsonOpts),
        };
    }

    public static APIGatewayHttpApiV2ProxyResponse BadRequest(string message)
    {
        return Error(400, message);
    }

    public static APIGatewayHttpApiV2ProxyResponse Forbidden(string message)
    {
        return Error(403, message);
    }

    public static APIGatewayHttpApiV2ProxyResponse Error(int statusCode, string message)
    {
        return new APIGatewayHttpApiV2ProxyResponse
        {
            StatusCode = statusCode,
            Headers = CorsHeaders,
            Body = JsonSerializer.Serialize(new { error = message }, JsonOpts),
        };
    }
}
