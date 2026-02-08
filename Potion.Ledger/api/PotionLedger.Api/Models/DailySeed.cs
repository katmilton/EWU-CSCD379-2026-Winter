using System.ComponentModel.DataAnnotations;

namespace PotionLedger.Api.Models;

public class DailySeed
{
    [Key]
    public DateOnly Date { get; set; }

    public int Seed { get; set; }

    public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;
}
