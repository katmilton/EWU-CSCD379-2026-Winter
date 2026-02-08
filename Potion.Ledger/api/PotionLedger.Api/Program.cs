using Microsoft.EntityFrameworkCore;
using PotionLedger.Api.Data;
using PotionLedger.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Controllers + Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ---------- DB ----------
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

// ---------- Services ----------
builder.Services.AddScoped<IRunService, RunService>();
builder.Services.AddScoped<ITestimonialService, TestimonialService>();
builder.Services.AddScoped<SeedService>();

// ---------- CORS ----------
var origins = (builder.Configuration["CORS_ORIGINS"] ?? "")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    .Select(o => o.Trim().TrimEnd('/')) // normalize (remove trailing slash)
    .ToArray();

if (origins.Length == 0)
{
    origins = new[]
    {
        "http://localhost:3000",
        "http://localhost:5173",
        "https://blue-grass-03934d610.6.azurestaticapps.net"
    };
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("GameCors", p =>
    {
        p.WithOrigins(origins)
         .AllowAnyHeader()
         .AllowAnyMethod();
         // .AllowCredentials(); // only enable if you use cookies/auth (usually NO)
    });
});

var app = builder.Build();

// Log what origins we loaded (helps instantly)
app.Logger.LogInformation("CORS_ORIGINS allowed: {Origins}", string.Join(", ", origins));

// Swagger
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// IMPORTANT: middleware order matters
app.UseHttpsRedirection();

app.UseRouting();

// CORS must be between UseRouting and MapControllers
app.UseCors("GameCors");

app.UseAuthorization();

app.MapControllers();

// ---------- Migrations ----------
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

app.Run();

// For integration tests
public partial class Program { }
