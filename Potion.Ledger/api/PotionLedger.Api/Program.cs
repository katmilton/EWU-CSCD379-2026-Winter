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

builder.Services.AddDbContext<PotionLedgerDbContext>(opt => opt.UseSqlServer(conn));

// Service layer (rubric)
builder.Services.AddScoped<IRunService, RunService>();
builder.Services.AddScoped<ITestimonialService, TestimonialService>();

// CORS (rubric)
var origins = (builder.Configuration["CORS_ORIGINS"] ?? "")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(options =>
{
    options.AddPolicy("GameCors", p =>
    {
        if (origins.Length > 0)
            p.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod();
        else
            p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod(); // dev fallback
    });
});

var app = builder.Build();

// Apply migrations automatically (simple for class projects)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<PotionLedgerDbContext>();
    await db.Database.MigrateAsync();
}

app.UseCors("GameCors");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();

app.Run();

// For integration tests
public partial class Program { }
