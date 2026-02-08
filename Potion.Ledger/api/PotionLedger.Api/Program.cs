using Microsoft.EntityFrameworkCore;
using PotionLedger.Api.Data;
using PotionLedger.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Controllers + Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ----------------------------
// Connection string resolution
// ----------------------------
//
// Priority order:
// 1) ConnectionStrings:PotionLedgerDb  (Azure "Connection strings" tab, name = PotionLedgerDb)
// 2) PotionLedgerDb                   (Azure "App settings" tab, name = PotionLedgerDb)
// 3) Local fallback (LocalDB) for dev machines
//
var env = builder.Environment.EnvironmentName;
var isTesting = builder.Environment.IsEnvironment("Testing");
var isCi = string.Equals(Environment.GetEnvironmentVariable("CI"), "true", StringComparison.OrdinalIgnoreCase);

var conn =
    builder.Configuration.GetConnectionString("PotionLedgerDb")
    ?? builder.Configuration["PotionLedgerDb"];

// If you didn't provide a conn string:
// - In CI/Testing: use InMemory so tests don't fail.
// - Otherwise: fall back to LocalDB for local dev.
var useInMemory = false;

if (string.IsNullOrWhiteSpace(conn))
{
    if (isTesting || isCi)
    {
        useInMemory = true;
    }
    else
    {
        conn = @"Server=(localdb)\MSSQLLocalDB;Database=PotionLedgerDb;Trusted_Connection=True;TrustServerCertificate=True;";
    }
}

builder.Services.AddDbContext<PotionLedgerDbContext>(options =>
{
    if (useInMemory)
    {
        options.UseInMemoryDatabase("PotionLedgerDb_Test");
    }
    else
    {
        options.UseSqlServer(conn!, sql => sql.EnableRetryOnFailure(
            maxRetryCount: 8,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorNumbersToAdd: null
        ));
    }
});

// Service layer (rubric)
builder.Services.AddScoped<IRunService, RunService>();
builder.Services.AddScoped<ITestimonialService, TestimonialService>();
builder.Services.AddScoped<SeedService>();

// ----------------------------
// CORS
// ----------------------------
var origins = (builder.Configuration["CORS_ORIGINS"] ?? "")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

// Keep sensible local defaults if none provided.
// (You already said you've verified CORS_ORIGINS, so this is just a safety net.)
if (origins.Length == 0)
{
    origins = new[]
    {
        "http://localhost:3000",
        "http://localhost:5173",
    };
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("GameCors", p =>
    {
        p.WithOrigins(origins)
         .AllowAnyHeader()
         .AllowAnyMethod();
        // Don't add AllowCredentials unless you truly need cookies/auth.
        // If you DO add AllowCredentials, you cannot use "*" for origins.
    });
});

var app = builder.Build();

// Swagger in dev (optional, but nice)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// CORS must run before controllers
app.UseCors("GameCors");

// Optional migrations:
// - Always run in Development (when using SQL Server)
// - Or when RUN_MIGRATIONS=true
// Never run migrations for InMemory.
var runMigrations =
    !useInMemory &&
    (app.Environment.IsDevelopment()
     || string.Equals(builder.Configuration["RUN_MIGRATIONS"], "true", StringComparison.OrdinalIgnoreCase));

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

// Health check (quick sanity test in Azure)
app.MapGet("/api/health", () => Results.Ok(new
{
    ok = true,
    env = app.Environment.EnvironmentName,
    db = useInMemory ? "InMemory" : "SqlServer"
}));

app.MapControllers();

app.Run();

// For integration tests
public partial class Program { }
