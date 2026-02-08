using Microsoft.AspNetCore.Mvc;
using PotionLedger.Api.Services;

namespace PotionLedger.Api.Controllers;

[ApiController]
[Route("api/seeds")]
public class SeedsController : ControllerBase
{
    private readonly SeedService _seeds;

    public SeedsController(SeedService seeds)
    {
        _seeds = seeds;
    }

    [HttpGet("daily")]
    public async Task<IActionResult> Daily([FromQuery] string? date = null)
    {
        // default to UTC date to keep “daily” consistent for all users
        var d = date is null
            ? DateOnly.FromDateTime(DateTime.UtcNow)
            : DateOnly.Parse(date);

        var (day, seed) = await _seeds.GetOrCreateDailySeedAsync(d);
        return Ok(new { date = day.ToString("yyyy-MM-dd"), seed });
    }

    [HttpGet("random")]
    public Task<IActionResult> Random()
    {
        var seed = _seeds.CreateRandomSeed();
        return Task.FromResult<IActionResult>(Ok(new { seed }));
    }
}
