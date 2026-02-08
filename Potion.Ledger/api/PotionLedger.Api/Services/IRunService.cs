using PotionLedger.Api.Models;

namespace PotionLedger.Api.Services;

public interface IRunService
{
    Task<(Run saved, int rankAllTime)> CreateRunAsync(string playerName, int score, int turnsUsed, int fizzles);
    Task<IReadOnlyList<Run>> GetTopAllTimeAsync(int take);
}
