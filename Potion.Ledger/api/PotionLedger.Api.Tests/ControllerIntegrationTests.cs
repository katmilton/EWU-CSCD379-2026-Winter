using System.Net.Http.Json;
using Xunit;
using PotionLedger.Api.Dtos;

public class ControllerIntegrationTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;
    public ControllerIntegrationTests(TestWebApplicationFactory factory) => _factory = factory;

    [Fact]
    public async Task PostRun_ReturnsOk()
    {
        var client = _factory.CreateClient();
        var res = await client.PostAsJsonAsync("/api/runs", new RunCreateRequest("Tester", 123, 7, 1));
        res.EnsureSuccessStatusCode();
    }
}
