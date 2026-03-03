namespace TtsLeagueApi.Models;

public class RaceResult
{
    public string TrackName { get; set; } = string.Empty;
    public string TrackConfig { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string SessionType { get; set; } = string.Empty;
    public List<DriverResult> Results { get; set; } = new();
}

public class DriverResult
{
    public int Position { get; set; }
    public string DriverName { get; set; } = string.Empty;
    public string CarModel { get; set; } = string.Empty;
    public string BestLap { get; set; } = string.Empty;
    public string TotalTime { get; set; } = string.Empty;
    public bool HasPenalty { get; set; }
    public string PenaltyTime { get; set; } = string.Empty;
    public int LapPenalty { get; set; }
    public bool Disqualified { get; set; }
    public int BallastKg { get; set; }
}
