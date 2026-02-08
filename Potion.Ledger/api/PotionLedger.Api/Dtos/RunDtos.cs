namespace PotionLedger.Api.Dtos;

public record RunCreateRequest(string PlayerName, int Score, int TurnsUsed, int Fizzles);
public record RunCreateResponse(int Id, string PlayerName, int Score, int TurnsUsed, int Fizzles, DateTime CreatedUtc, int RankAllTime);
