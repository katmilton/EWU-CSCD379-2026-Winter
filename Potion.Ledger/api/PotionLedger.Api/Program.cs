using Microsoft.EntityFrameworkCore;
using PotionLedger.Api.Data;
using PotionLedger.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Controllers + Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// -------------------------
// DB connection
// -------------------------
var conn =
    builder.Configuration.GetConnectionString("PotionLedgerDb")
    ?? builder.Configuration["PotionLedgerDb"]
    ?? "Server=(localdb)\\MSSQLLocalDB;Database=PotionLedgerDb;Trusted_Connection=True;";

if (string.IsNullOrWhiteSpace(conn))
    throw new InvalidOperationException("Missing connection string 'PotionLedgerDb'.");

builder.Services.AddDbContext<PotionLedgerDbContext>(options =>
{
    options.UseSqlServer(conn, sql => sql.EnableRetryOnFailure(
        maxRetryCount: 8,
        maxRetryDelay: TimeSpan.FromSeconds(10),
        errorNumbersToAdd: null
    ));
});

// Service layer (rubric)
builder.Services.AddScoped<IRunService, RunService>();
builder.Services.AddScoped<ITestimonialService, TestimonialService>();
builder.Services.AddScoped<SeedService>();

// -------------------------
// CORS (rubric) - hardened
// -------------------------
// Reads from Azure App Setting: CORS_ORIGINS
// Example value:
// https://blue-grass-03934d610.6.azurestaticapps.net
// OR multiple:
// https://site1.net,https://site2.net
static string NormalizeOrigin(string s)
{
    s = s.Trim();
    while (s.EndsWith("/")) s = s[..^1];
    return s;
}

var originsRaw = builder.Configuration["CORS_ORIGINS"] ?? "";
var origins = originsRaw
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    .Select(NormalizeOrigin)
    .Where(x => !string.IsNullOrWhiteSpace(x))
    .Distinct(StringComparer.OrdinalIgnoreCase)
    .ToArray();

// fallback defaults (only if env var not provided)
if (origins.Length == 0)
{
    origins = new[]
    {
        "http://localhost:3000",
        "http://localhost:5173",
        "https://blue-grass-03934d610.6.azurestaticapps.net",
    }.Select(NormalizeOrigin).ToArray();
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("GameCors", p =>
    {
        p.WithOrigins(origins)
         .AllowAnyHeader()
         .AllowAnyMethod();

        // Only add this if you ever send cookies/auth headers cross-site:
        // p.AllowCredentials();
        //
        // IMPORTANT: If you enable AllowCredentials(), you may NOT use AllowAnyOrigin().
    });
});

var app = builder.Build();

// Log allowed origins so you can see it in Azure Log Stream
app.Logger.LogInformation("CORS_ORIGINS raw: {Raw}", originsRaw);
app.Logger.LogInformation("CORS allowed origins: {Origins}", string.Join(", ", origins));

// Swagger
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Routing + CORS order matters
app.UseRouting();

// Apply CORS globally
app.UseCors("GameCors");

// If you ever add auth later:
// app.UseAuthentication();
// app.UseAuthorization();

// Apply migrations automatically for local dev (and optionally in prod)
var runMigrations = app.Environment.IsDevelopment()
    || string.Equals(builder.Configuration["RUN_MIGRATIONS"], "true", StringComparison.OrdinalIgnoreCase);

if (runMigrations)
{
    try
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PotionLedgerDbContext>();
        await db.Database.MigrateAsync();
    }
    catch (Exception ex)
    {
        app.Logger.LogWarning(ex, "Skipping DB migration (DB not available).");
    }
}

// Force CORS at endpoint level too (this is the part that often fixes “still missing header”)
app.MapControllers().RequireCors("GameCors");

// Simple health check endpoint (handy for Azure)
app.MapGet("/api/health", () => Results.Ok(new { ok = true, utc = DateTime.UtcNow }))
   .RequireCors("GameCors");

app.Run();

// For integration tests
public partial class Program { }
