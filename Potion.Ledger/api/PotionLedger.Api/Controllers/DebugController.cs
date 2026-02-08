using Microsoft.AspNetCore.Mvc;
using PotionLedger.Api.Data;

namespace PotionLedger.Api.Controllers;

[ApiController]
[Route("api/debug")]
public class DebugController : ControllerBase
{
    private readonly PotionLedgerDbContext _db;

    public DebugController(PotionLedgerDbContext db)
    {
        _db = db;
    }

    [HttpGet("db")]
    public async Task<IActionResult> Db()
    {
        try
        {
            var canConnect = await _db.Database.CanConnectAsync();
            return Ok(new
            {
                ok = canConnect,
                provider = _db.Database.ProviderName,
                utc = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                error = ex.GetType().FullName,
                message = ex.Message,
                inner = ex.InnerException?.Message,
                provider = _db.Database.ProviderName
            });
        }
    }
}
