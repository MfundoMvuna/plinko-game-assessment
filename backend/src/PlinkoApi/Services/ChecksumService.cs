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
        return Convert.ToString(Math.Abs(hash), 36);
    }

    public bool Validate(string playerName, int score, int dropsUsed, string checksum)
    {
        return Generate(playerName, score, dropsUsed) == checksum;
    }
}
