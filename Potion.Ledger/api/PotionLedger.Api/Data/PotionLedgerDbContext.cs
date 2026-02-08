using Microsoft.EntityFrameworkCore;
using PotionLedger.Api.Models;

namespace PotionLedger.Api.Data;

public class PotionLedgerDbContext : DbContext
{
    public PotionLedgerDbContext(DbContextOptions<PotionLedgerDbContext> options) : base(options) { }

    public DbSet<Run> Runs => Set<Run>();
    public DbSet<Testimonial> Testimonials => Set<Testimonial>();
}
