using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using PotionLedger.Api.Data;

namespace PotionLedger.Api.Controllers;

[ApiController]
[Route("api/debug")]
public class DebugController : ControllerBase
{
    private readonly PotionLedgerDbContext _db;
    private readonly IConfiguration _config;

    public DebugController(PotionLedgerDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    [HttpGet("db")]
    public async Task<IActionResult> Db()
    {
        var utc = DateTime.UtcNow;
        var provider = _db.Database.ProviderName ?? "(unknown)";

        // Read the same way Program.cs does (plus common fallbacks).
        string? conn =
            _config.GetConnectionString("PotionLedgerDb")
            ?? _config.GetConnectionString("PotionLedgerDB")
            ?? _config.GetConnectionString("DefaultConnection")
            ?? _config["ConnectionStrings:PotionLedgerDb"]
            ?? _config["ConnectionStrings__PotionLedgerDb"]
            ?? _config["PotionLedgerDb"]
            ?? _config["PotionLedgerDB"]
            ?? _config["DefaultConnection"];

        object? connInfo = null;
        if (!string.IsNullOrWhiteSpace(conn))
        {
            try
            {
                var sb = new SqlConnectionStringBuilder(conn);
                connInfo = new
                {
                    dataSource = sb.DataSource,
                    initialCatalog = sb.InitialCatalog,
                    encrypt = sb.Encrypt,
                    trustServerCertificate = sb.TrustServerCertificate,
                    connectTimeout = sb.ConnectTimeout,
                    authMode = sb.Authentication.ToString(), // NotSpecified = SQL auth
                    hasUserId = !string.IsNullOrWhiteSpace(sb.UserID),
                    hasPassword = !string.IsNullOrWhiteSpace(sb.Password),
                };
            }
            catch (Exception parseEx)
            {
                connInfo = new { parseError = parseEx.Message };
            }
        }

        if (string.IsNullOrWhiteSpace(conn))
        {
            return Ok(new
            {
                ok = false,
                provider,
                utc,
                connFound = false,
                connInfo
            });
        }

        try
        {
            // Force a real connection attempt to get the real SqlException
            await _db.Database.OpenConnectionAsync();

            // If we got here, we connected successfully
            await _db.Database.CloseConnectionAsync();

            return Ok(new
            {
                ok = true,
                provider,
                utc,
                connFound = true,
                connInfo
            });
        }
        catch (SqlException ex)
        {
            // This is the gold we need: error number + message
            return Ok(new
            {
                ok = false,
                provider,
                utc,
                connFound = true,
                connInfo,
                sqlError = new
                {
                    ex.Number,
                    ex.State,
                    ex.Class,
                    ex.Message
                }
            });
        }
        catch (Exception ex)
        {
            return Ok(new
            {
                ok = false,
                provider,
                utc,
                connFound = true,
                connInfo,
                error = new
                {
                    exType = ex.GetType().FullName,
                    ex.Message,
                    inner = Flatten(ex.InnerException)
                }
            });
        }
    }

    private static object? Flatten(Exception? ex)
    {
        if (ex == null) return null;
        return new
        {
            exType = ex.GetType().FullName,
            ex.Message,
            inner = Flatten(ex.InnerException)
        };
    }
}
