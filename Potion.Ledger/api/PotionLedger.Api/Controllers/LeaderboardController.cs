using Microsoft.AspNetCore.Mvc;
using PotionLedger.Api.Services;

namespace PotionLedger.Api.Controllers;

[ApiController]
[Route("api/leaderboard")]
public class LeaderboardController : ControllerBase
{
    private readonly IRunService _runs;
    public LeaderboardController(IRunService runs) => _runs = runs;

    // GET that returns an object (rubric)
    [HttpGet("alltime")]
    public async Task<ActionResult<object>> GetAllTime()
    {
        var top = await _runs.GetTopAllTimeAsync(10);
        return Ok(new { generatedUtc = DateTime.UtcNow, entries = top });
    }
}
