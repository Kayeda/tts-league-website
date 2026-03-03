using Microsoft.AspNetCore.Mvc;
using TtsLeagueApi.Services;

namespace TtsLeagueApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChampionshipController : ControllerBase
{
    private readonly AcServerManagerService _service;

    public ChampionshipController(AcServerManagerService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetChampionshipInfo()
    {
        var info = await _service.GetChampionshipInfoAsync();
        if (info == null) return StatusCode(503, new { message = "Unable to fetch championship data" });
        return Ok(info);
    }
}
