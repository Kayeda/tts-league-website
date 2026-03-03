using Microsoft.AspNetCore.Mvc;
using TtsLeagueApi.Services;

namespace TtsLeagueApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RacesController : ControllerBase
{
    private readonly AcServerManagerService _service;

    public RacesController(AcServerManagerService service) => _service = service;

    [HttpGet("upcoming")]
    public async Task<IActionResult> GetUpcomingRaces()
    {
        var races = await _service.GetUpcomingRacesAsync();
        return Ok(races);
    }

    [HttpGet("all")]
    public async Task<IActionResult> GetAllEvents()
    {
        var events = await _service.GetAllEventsAsync();
        return Ok(events);
    }

    [HttpGet("results")]
    public async Task<IActionResult> GetLastRaceResult()
    {
        var result = await _service.GetLastRaceResultAsync();
        if (result == null) return NotFound(new { message = "No race results found" });
        return Ok(result);
    }
}
