namespace PotionLedger.Api.Models;

public class Run
{
    public int Id { get; set; }
    public string PlayerName { get; set; } = "";
    public int Score { get; set; }
    public int TurnsUsed { get; set; }
    public int Fizzles { get; set; }
    public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;
}
