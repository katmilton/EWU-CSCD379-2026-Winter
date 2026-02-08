using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace PotionLedger.Api.Data;

public class PotionLedgerDbContextFactory : IDesignTimeDbContextFactory<PotionLedgerDbContext>
{
    public PotionLedgerDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<PotionLedgerDbContext>()
            .UseSqlServer("Server=(localdb)\\MSSQLLocalDB;Database=PotionLedgerDb;Trusted_Connection=True;MultipleActiveResultSets=true")
            .Options;

        return new PotionLedgerDbContext(options);
    }
}
