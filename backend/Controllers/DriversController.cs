using Microsoft.AspNetCore.Mvc;
using TtsLeagueApi.Services;

namespace TtsLeagueApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DriversController : ControllerBase
{
    private readonly AcServerManagerService _service;

    public DriversController(AcServerManagerService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetDrivers()
    {
        var drivers = await _service.GetDriversAsync();
        return Ok(drivers);
    }
}
