using Microsoft.EntityFrameworkCore;
using PotionLedger.Api.Data;
using PotionLedger.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Controllers + Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// EF Core SQL Server
var conn = builder.Configuration.GetConnectionString("PotionLedgerDb")
           ?? builder.Configuration["PotionLedgerDb"]
           ?? "Server=(localdb)\\MSSQLLocalDB;Database=PotionLedgerDb;Trusted_Connection=True;";

if (string.IsNullOrWhiteSpace(conn))
    throw new InvalidOperationException("Missing connection string 'PotionLedgerDb'.");

builder.Services.AddDbContext<PotionLedgerDbContext>(options =>
{
    options.UseSqlServer(
        conn,
        sql => sql.EnableRetryOnFailure(
            maxRetryCount: 8,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorNumbersToAdd: null
        )
    );
});


// Service layer (rubric)
builder.Services.AddScoped<IRunService, RunService>();
builder.Services.AddScoped<ITestimonialService, TestimonialService>();
builder.Services.AddScoped<SeedService>();


// CORS (rubric)
var origins = (builder.Configuration["CORS_ORIGINS"] ?? "")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

// Sensible defaults so a first deployment works without extra portal steps.
// You can override by setting CORS_ORIGINS (comma-separated) in Azure App Service.
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
    });
});

var app = builder.Build();
app.UseCors("GameCors");

// Apply migrations automatically for local dev (and optionally in prod).
// This avoids breaking CI / integration tests where no SQL Server is available.
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

app.MapControllers();

app.Run();

// For integration tests
public partial class Program { }
