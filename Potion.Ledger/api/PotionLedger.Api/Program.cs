using Microsoft.EntityFrameworkCore;
using PotionLedger.Api.Data;
using PotionLedger.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Controllers + Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// --------------------
// Database (EF Core)
// --------------------
var conn =
    builder.Configuration.GetConnectionString("PotionLedgerDb")
    ?? builder.Configuration["PotionLedgerDb"]
    ?? "Server=(localdb)\\MSSQLLocalDB;Database=PotionLedgerDb;Trusted_Connection=True;";

if (string.IsNullOrWhiteSpace(conn))
    throw new InvalidOperationException("Missing connection string 'PotionLedgerDb'.");

builder.Services.AddDbContext<PotionLedgerDbContext>(options =>
{
    options.UseSqlServer(conn, sql =>
        sql.EnableRetryOnFailure(
            maxRetryCount: 8,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorNumbersToAdd: null
        )
    );
});

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

if (origins.Length == 0)
{
    origins = new[]
    {
        "https://blue-grass-03934d610.6.azurestaticapps.net",
        "http://localhost:3000",
        "http://localhost:5173",
    };
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("GameCors", policy =>
    {
        policy
            .WithOrigins(origins)
            .AllowAnyHeader()
            .AllowAnyMethod();

        // If you ever use cookies/auth later, you'd also need:
        // .AllowCredentials();
        // ...and you cannot use "*" for origins.
    });
});

var app = builder.Build();

// Swagger (optional but nice for dev)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// ✅ Order matters for CORS:
// Routing -> CORS -> Endpoints
app.UseRouting();
app.UseCors("GameCors");

// --------------------
// Migrations (dev or opt-in)
// --------------------
var runMigrations =
    app.Environment.IsDevelopment()
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
