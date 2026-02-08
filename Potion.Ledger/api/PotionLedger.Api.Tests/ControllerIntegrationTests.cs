using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;
using PotionLedger.Api.Dtos;

public class ControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    public ControllerIntegrationTests(WebApplicationFactory<Program> factory) => _factory = factory;

    [Fact]
    public async Task PostRun_ReturnsOk()
    {
        var client = _factory.CreateClient();
        var res = await client.PostAsJsonAsync("/api/runs", new RunCreateRequest("Tester", 123, 7, 1));
        res.EnsureSuccessStatusCode();
    }
}
