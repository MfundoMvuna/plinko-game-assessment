namespace PlinkoApi.Services;

public interface IChecksumService
{
    string Generate(string playerName, int score, int dropsUsed);
    bool Validate(string playerName, int score, int dropsUsed, string checksum);
}

public class ChecksumService : IChecksumService
{
    private const string Salt = "plinko-salt-2026";

    public string Generate(string playerName, int score, int dropsUsed)
    {
        var raw = $"{playerName}:{score}:{dropsUsed}:{Salt}";
        var hash = 0;
        foreach (var c in raw)
        {
            hash = ((hash << 5) - hash + c) | 0;
        }
        return ToBase36(Math.Abs(hash));
    }

    private static string ToBase36(int value)
    {
        const string chars = "0123456789abcdefghijklmnopqrstuvwxyz";
        if (value == 0) return "0";
        var result = "";
        while (value > 0)
        {
            result = chars[value % 36] + result;
            value /= 36;
        }
        return result;
    }

    public bool Validate(string playerName, int score, int dropsUsed, string checksum)
    {
        return Generate(playerName, score, dropsUsed) == checksum;
    }
}
