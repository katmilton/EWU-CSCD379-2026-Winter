using Microsoft.EntityFrameworkCore;
using PotionLedger.Api.Data;
using PotionLedger.Api.Models;

namespace PotionLedger.Api.Services;

public class RunService : IRunService
{
    private readonly PotionLedgerDbContext _db;
    public RunService(PotionLedgerDbContext db) => _db = db;

    public async Task<(Run saved, int rankAllTime)> CreateRunAsync(string playerName, int score, int turnsUsed, int fizzles)
    {
        var run = new Run
        {
            PlayerName = playerName.Trim(),
            Score = score,
            TurnsUsed = turnsUsed,
            Fizzles = fizzles,
            CreatedUtc = DateTime.UtcNow
        };

        _db.Runs.Add(run);
        await _db.SaveChangesAsync();

        // Rank: 1 = best (higher score first, then fewer turns, then fewer fizzles)
        var betterCount = await _db.Runs.CountAsync(r =>
            r.Score > run.Score ||
            (r.Score == run.Score && r.TurnsUsed < run.TurnsUsed) ||
            (r.Score == run.Score && r.TurnsUsed == run.TurnsUsed && r.Fizzles < run.Fizzles)
        );

        return (run, betterCount + 1);
    }

    public async Task<IReadOnlyList<Run>> GetTopAllTimeAsync(int take)
    {
        return await _db.Runs
            .OrderByDescending(r => r.Score)
            .ThenBy(r => r.TurnsUsed)
            .ThenBy(r => r.Fizzles)
            .ThenBy(r => r.CreatedUtc)
            .Take(take)
            .ToListAsync();
    }
}
