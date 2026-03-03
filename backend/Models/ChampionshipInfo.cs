namespace TtsLeagueApi.Models;

public class ChampionshipInfo
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int NumEvents { get; set; }
    public int NumEntrants { get; set; }
    public int NumClasses { get; set; }
    public string ClassName { get; set; } = string.Empty;
}
