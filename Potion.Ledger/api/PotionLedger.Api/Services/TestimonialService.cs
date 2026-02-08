using Microsoft.EntityFrameworkCore;
using PotionLedger.Api.Data;
using PotionLedger.Api.Models;

namespace PotionLedger.Api.Services;

public class TestimonialService : ITestimonialService
{
    private readonly PotionLedgerDbContext _db;
    public TestimonialService(PotionLedgerDbContext db) => _db = db;

    public async Task<Testimonial> CreateAsync(string name, int rating, string message)
    {
        var t = new Testimonial
        {
            Name = name.Trim(),
            Rating = rating,
            Message = message.Trim(),
            CreatedUtc = DateTime.UtcNow
        };
        _db.Testimonials.Add(t);
        await _db.SaveChangesAsync();
        return t;
    }

    public async Task<IReadOnlyList<Testimonial>> GetRecentAsync(int take)
    {
        return await _db.Testimonials
            .OrderByDescending(t => t.CreatedUtc)
            .Take(take)
            .ToListAsync();
    }
}
