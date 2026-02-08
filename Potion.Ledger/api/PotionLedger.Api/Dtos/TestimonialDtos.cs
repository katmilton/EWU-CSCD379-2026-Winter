namespace PotionLedger.Api.Dtos;

public record TestimonialCreateRequest(string Name, int Rating, string Message);
public record TestimonialDto(int Id, string Name, int Rating, string Message, DateTime CreatedUtc);
