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

        // Try to find the connection string via all the common keys
        // (we do NOT return the password)
        string? conn =
            _config.GetConnectionString("PotionLedgerDb")
            ?? _config.GetConnectionString("PotionLedgerDB")
            ?? _config.GetConnectionString("DefaultConnection")
            ?? _config["ConnectionStrings:PotionLedgerDb"]
            ?? _config["ConnectionStrings:PotionLedgerDb".Replace(":", "__")] // ConnectionStrings__PotionLedgerDb
            ?? _config["PotionLedgerDb"]
            ?? _config["PotionLedgerDB"]
            ?? _config["DefaultConnection"];

        // Return a sanitized view (server + database only)
        object? parsedConn = null;
        if (!string.IsNullOrWhiteSpace(conn))
        {
            try
            {
                var sb = new SqlConnectionStringBuilder(conn);
                parsedConn = new
                {
                    sb.DataSource,
                    sb.InitialCatalog,
                    sb.Encrypt,
                    sb.TrustServerCertificate,
                    sb.ConnectTimeout,
                    AuthMode = sb.Authentication.ToString(), // will show "NotSpecified" for SQL auth
                    HasUserId = !string.IsNullOrWhiteSpace(sb.UserID),
                    HasPassword = !string.IsNullOrWhiteSpace(sb.Password),
                };
            }
            catch
            {
                parsedConn = new { parseError = "Could not parse connection string (format issue)." };
            }
        }

        try
        {
            // This is the real test:
            // - For SQL Server provider, CanConnectAsync() actually tries to reach the DB.
            var canConnect = await _db.Database.CanConnectAsync();

            return Ok(new
            {
                ok = canConnect,
                provider,
                utc,
                connFound = !string.IsNullOrWhiteSpace(conn),
                connInfo = parsedConn,
            });
        }
        catch (Exception ex)
        {
            // Return the real reason (message + inner exception chain)
            return Ok(new
            {
                ok = false,
                provider,
                utc,
                connFound = !string.IsNullOrWhiteSpace(conn),
                connInfo = parsedConn,
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
