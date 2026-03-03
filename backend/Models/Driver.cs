namespace TtsLeagueApi.Models;

public class Driver
{
    public string Name { get; set; } = string.Empty;
    public string Team { get; set; } = string.Empty;
    public string Guid { get; set; } = string.Empty;
    public string CarModel { get; set; } = string.Empty;
    public string Skin { get; set; } = string.Empty;
    public int RaceNumber { get; set; }
}
