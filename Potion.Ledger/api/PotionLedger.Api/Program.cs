using Microsoft.EntityFrameworkCore;
using PotionLedger.Api.Data;
using PotionLedger.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Controllers + Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// --------------------
// Connection string resolution
// --------------------
// Azure App Service "Connection strings" become env vars like:
//   ConnectionStrings__PotionLedgerDb
// so GetConnectionString("PotionLedgerDb") is the most reliable.
// We also accept a couple legacy names to avoid “hunt down bits”.
string? conn =
    builder.Configuration.GetConnectionString("PotionLedgerDb")
    ?? builder.Configuration.GetConnectionString("PotionLedgerDB")
    ?? builder.Configuration.GetConnectionString("DefaultConnection")
    ?? builder.Configuration["ConnectionStrings:PotionLedgerDb"]
    ?? builder.Configuration["ConnectionStrings__PotionLedgerDb"]
    ?? builder.Configuration["PotionLedgerDb"]
    ?? builder.Configuration["PotionLedgerDB"]
    ?? builder.Configuration["DefaultConnection"];

// --------------------
// EF Core
// --------------------
// If we have a connection string, use SQL Server.
// Otherwise, fall back to InMemory so CI/tests can boot the app.
if (!string.IsNullOrWhiteSpace(conn))
{
    builder.Services.AddDbContext<PotionLedgerDbContext>(options =>
    {
        options.UseSqlServer(conn, sql => sql.EnableRetryOnFailure(
            maxRetryCount: 8,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorNumbersToAdd: null
        ));
    });
}
else
{
    // CI/integration tests fallback. (You already have EFCore.InMemory installed.)
    builder.Services.AddDbContext<PotionLedgerDbContext>(options =>
    {
        options.UseInMemoryDatabase("PotionLedgerDb_InMemory");
    });
}

// --------------------
// Services (rubric)
// --------------------
builder.Services.AddScoped<IRunService, RunService>();
builder.Services.AddScoped<ITestimonialService, TestimonialService>();
builder.Services.AddScoped<SeedService>();

// --------------------
// CORS (rubric)
// --------------------
var origins = (builder.Configuration["CORS_ORIGINS"] ?? "")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

// If not set, allow common local dev + your static app default.
if (origins.Length == 0)
{
    origins = new[]
    {
        "http://localhost:3000",
        "http://localhost:5173",
        "https://blue-grass-03934d610.6.azurestaticapps.net",
    };
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("GameCors", p =>
    {
        p.WithOrigins(origins)
         .AllowAnyHeader()
         .AllowAnyMethod();
        // NOTE: do NOT call AllowCredentials() unless you truly need cookies/auth.
    });
});

var app = builder.Build();

// --------------------
// Middleware pipeline
// --------------------
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseRouting();

// Put CORS after routing and before endpoints
app.UseCors("GameCors");

app.UseAuthorization();

// --------------------
// Migrations (optional)
// --------------------
// Only run migrations when:
// - Development, OR
// - RUN_MIGRATIONS=true
var runMigrations =
    app.Environment.IsDevelopment() ||
    string.Equals(builder.Configuration["RUN_MIGRATIONS"], "true", StringComparison.OrdinalIgnoreCase);

if (runMigrations)
{
    try
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PotionLedgerDbContext>();

        // Only attempt SQL migrations if we're actually using SQL Server.
        // InMemory provider doesn't support Migrate().
        if (db.Database.ProviderName?.Contains("SqlServer", StringComparison.OrdinalIgnoreCase) == true)
        {
            db.Database.Migrate();
        }
    }
    catch (Exception ex)
    {
        app.Logger.LogWarning(ex, "Skipping DB migration (DB not available or not SQL Server).");
    }
}

// Health endpoint that never touches DB
app.MapGet("/api/health", () => Results.Ok(new
{
    ok = true,
    utc = DateTime.UtcNow
}));

app.MapControllers();

app.Run();

// For integration tests
public partial class Program { }
