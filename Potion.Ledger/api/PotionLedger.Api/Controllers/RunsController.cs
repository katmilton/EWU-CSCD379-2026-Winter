using Microsoft.AspNetCore.Mvc;
using PotionLedger.Api.Dtos;
using PotionLedger.Api.Services;

namespace PotionLedger.Api.Controllers;

[ApiController]
[Route("api/runs")]
public class RunsController : ControllerBase
{
    private readonly IRunService _runs;
    public RunsController(IRunService runs) => _runs = runs;

    [HttpPost]
    public async Task<ActionResult<RunCreateResponse>> Create([FromBody] RunCreateRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.PlayerName) || req.PlayerName.Length > 24)
            return BadRequest("PlayerName is required and must be <= 24 chars.");

        if (req.Score < 0 || req.TurnsUsed < 0 || req.Fizzles < 0)
            return BadRequest("Score/TurnsUsed/Fizzles must be non-negative.");

        var (saved, rank) = await _runs.CreateRunAsync(req.PlayerName, req.Score, req.TurnsUsed, req.Fizzles);

        return Ok(new RunCreateResponse(
            saved.Id, saved.PlayerName, saved.Score, saved.TurnsUsed, saved.Fizzles, saved.CreatedUtc, rank
        ));
    }
}
