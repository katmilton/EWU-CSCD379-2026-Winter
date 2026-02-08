using Microsoft.AspNetCore.Mvc;
using PotionLedger.Api.Dtos;
using PotionLedger.Api.Services;

namespace PotionLedger.Api.Controllers;

[ApiController]
[Route("api/testimonials")]
public class TestimonialsController : ControllerBase
{
    private readonly ITestimonialService _svc;
    public TestimonialsController(ITestimonialService svc) => _svc = svc;

    [HttpGet]
    public async Task<ActionResult<object>> Get()
    {
        var items = await _svc.GetRecentAsync(25);
        return Ok(new { generatedUtc = DateTime.UtcNow, testimonials = items });
    }

    [HttpPost]
    public async Task<ActionResult<TestimonialDto>> Create([FromBody] TestimonialCreateRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name) || req.Name.Length > 24)
            return BadRequest("Name is required and must be <= 24 chars.");
        if (req.Rating is < 1 or > 5)
            return BadRequest("Rating must be 1-5.");
        if (string.IsNullOrWhiteSpace(req.Message) || req.Message.Length > 400)
            return BadRequest("Message is required and must be <= 400 chars.");

        var saved = await _svc.CreateAsync(req.Name, req.Rating, req.Message);
        return Ok(new TestimonialDto(saved.Id, saved.Name, saved.Rating, saved.Message, saved.CreatedUtc));
    }
}
