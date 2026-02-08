using PotionLedger.Api.Models;

namespace PotionLedger.Api.Services;

public interface ITestimonialService
{
    Task<Testimonial> CreateAsync(string name, int rating, string message);
    Task<IReadOnlyList<Testimonial>> GetRecentAsync(int take);
}
