namespace TtsLeagueApi.Models;

public class RaceEvent
{
    public int EventIndex { get; set; }
    public string TrackName { get; set; } = string.Empty;
    public string TrackConfig { get; set; } = string.Empty;
    public DateTime? ScheduledDate { get; set; }
    public int Laps { get; set; }
    public bool IsCompleted { get; set; }
    public List<SessionInfo> Sessions { get; set; } = new();
    public List<string> WeatherGraphics { get; set; } = new();
}

public class SessionInfo
{
    public string Type { get; set; } = string.Empty; // Practice, Qualifying, Race
    public int DurationMinutes { get; set; }
    public int Laps { get; set; }
    public DateTime? ScheduledDate { get; set; }
    public List<string> WeatherGraphics { get; set; } = new();
}
