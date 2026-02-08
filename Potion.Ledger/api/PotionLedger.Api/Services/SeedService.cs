using Microsoft.EntityFrameworkCore;
using PotionLedger.Api.Data;
using PotionLedger.Api.Models;
using System.Security.Cryptography;
using System.Text;

namespace PotionLedger.Api.Services;

public class SeedService
{
    private readonly PotionLedgerDbContext _db;
    private readonly IConfiguration _config;

    public SeedService(PotionLedgerDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    // Deterministic seed for a given date (same date => same seed)
    // Also persisted to DB so it never changes even if secret changes later.
    public async Task<(DateOnly date, int seed)> GetOrCreateDailySeedAsync(DateOnly date)
    {
        var existing = await _db.DailySeeds.AsNoTracking().FirstOrDefaultAsync(x => x.Date == date);
        if (existing is not null)
            return (existing.Date, existing.Seed);

        var seed = ComputeDailySeed(date);

        _db.DailySeeds.Add(new DailySeed
        {
            Date = date,
            Seed = seed
        });

        await _db.SaveChangesAsync();
        return (date, seed);
    }

    // True random seed from crypto RNG
    public int CreateRandomSeed()
    {
        Span<byte> b = stackalloc byte[4];
        RandomNumberGenerator.Fill(b);
        var n = BitConverter.ToInt32(b);
        // keep it positive-ish and non-zero for convenience
        return (n == int.MinValue) ? 1 : Math.Abs(n);
    }

    private int ComputeDailySeed(DateOnly date)
    {
        // You should set DAILY_SEED_SECRET in Azure App Service settings.
        // If you never set it, it will still work; it just becomes guessable.
        var secret = _config["DAILY_SEED_SECRET"] ?? "dev-secret-change-me";

        var input = $"{date:yyyy-MM-dd}|{secret}";
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(input));

        // fold first 4 bytes into int
        var seed = BitConverter.ToInt32(hash, 0);
        if (seed == int.MinValue) seed = 1;
        seed = Math.Abs(seed);
        return seed == 0 ? 1 : seed;
    }
}
