using Microsoft.EntityFrameworkCore;
using PotionLedger.Api.Data;
using PotionLedger.Api.Services;
using Xunit;

public class RunServiceTests
{
    [Fact]
    public async Task CreateRunAsync_ComputesRank()
    {
        var opts = new DbContextOptionsBuilder<PotionLedgerDbContext>()
            .UseInMemoryDatabase("rank_test")
            .Options;

        using var db = new PotionLedgerDbContext(opts);
        var svc = new RunService(db);

        await svc.CreateRunAsync("A", 100, 8, 1);
        var (_, rank) = await svc.CreateRunAsync("B", 120, 8, 1);

        Assert.Equal(1, rank);
    }
}
