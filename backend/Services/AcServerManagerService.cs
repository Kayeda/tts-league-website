using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Caching.Memory;
using TtsLeagueApi.Models;

namespace TtsLeagueApi.Services;

public class AcServerManagerService
{
    private readonly HttpClient _httpClient;
    private readonly IMemoryCache _cache;
    private readonly ILogger<AcServerManagerService> _logger;

    private readonly string _baseUrl;
    private readonly string _championshipId;
    private const string ExportCacheKey = "championship_export";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);

    public AcServerManagerService(HttpClient httpClient, IMemoryCache cache, ILogger<AcServerManagerService> logger, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _cache = cache;
        _logger = logger;
        _baseUrl = configuration["AcServerManager:BaseUrl"] ?? "http://trytosurvive.servegame.com:8772";
        _championshipId = configuration["AcServerManager:ChampionshipId"] ?? "a680ac2c-5c26-475b-8319-25396357c5ef";
    }

    private async Task<JsonDocument?> GetExportDataAsync()
    {
        if (_cache.TryGetValue(ExportCacheKey, out JsonDocument? cached))
            return cached;

        try
        {
            var url = $"{_baseUrl}/championship/{_championshipId}/export";
            var response = await _httpClient.GetStringAsync(url);
            var doc = JsonDocument.Parse(response);
            _cache.Set(ExportCacheKey, doc, CacheDuration);
            return doc;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch championship export data");
            return null;
        }
    }

    public async Task<ChampionshipInfo?> GetChampionshipInfoAsync()
    {
        var doc = await GetExportDataAsync();
        if (doc == null) return null;

        var root = doc.RootElement;
        var stats = root.GetProperty("Stats");
        var className = "";
        if (root.TryGetProperty("Classes", out var classes) && classes.GetArrayLength() > 0)
        {
            className = classes[0].GetProperty("Name").GetString() ?? "";
        }

        return new ChampionshipInfo
        {
            Id = root.GetProperty("ID").GetString() ?? "",
            Name = root.GetProperty("Name").GetString() ?? "",
            NumEvents = stats.GetProperty("NumEvents").GetInt32(),
            NumEntrants = stats.GetProperty("NumEntrants").GetInt32(),
            NumClasses = stats.GetProperty("NumClasses").GetInt32(),
            ClassName = className
        };
    }

    public async Task<List<Driver>> GetDriversAsync()
    {
        var doc = await GetExportDataAsync();
        if (doc == null) return new List<Driver>();

        var drivers = new List<Driver>();
        var root = doc.RootElement;

        if (!root.TryGetProperty("Classes", out var classes)) return drivers;

        foreach (var cls in classes.EnumerateArray())
        {
            if (!cls.TryGetProperty("Entrants", out var entrants)) continue;

            foreach (var entrant in entrants.EnumerateObject())
            {
                var e = entrant.Value;
                drivers.Add(new Driver
                {
                    Name = e.GetProperty("Name").GetString() ?? "",
                    Team = e.GetProperty("Team").GetString() ?? "",
                    Guid = e.GetProperty("GUID").GetString() ?? "",
                    CarModel = e.GetProperty("Model").GetString() ?? "",
                    Skin = e.GetProperty("Skin").GetString() ?? "",
                    RaceNumber = e.GetProperty("RaceNumber").GetInt32()
                });
            }
        }

        return drivers.OrderBy(d => d.Team).ThenBy(d => d.Name).ToList();
    }

    public async Task<List<RaceEvent>> GetUpcomingRacesAsync()
    {
        var doc = await GetExportDataAsync();
        if (doc == null) return new List<RaceEvent>();

        var events = new List<RaceEvent>();
        var root = doc.RootElement;

        if (!root.TryGetProperty("Events", out var eventsArray)) return events;

        int index = 0;
        foreach (var evt in eventsArray.EnumerateArray())
        {
            var raceEvent = ParseRaceEvent(evt, index);
            if (raceEvent != null)
            {
                events.Add(raceEvent);
            }
            index++;
        }

        // Return only future or today's events, ordered by date
        var now = DateTime.UtcNow;
        return events
            .Where(e => !e.IsCompleted && (e.ScheduledDate == null || e.ScheduledDate > now.AddHours(-3)))
            .OrderBy(e => e.ScheduledDate ?? DateTime.MaxValue)
            .ToList();
    }

    public async Task<List<RaceEvent>> GetAllEventsAsync()
    {
        var doc = await GetExportDataAsync();
        if (doc == null) return new List<RaceEvent>();

        var events = new List<RaceEvent>();
        var root = doc.RootElement;

        if (!root.TryGetProperty("Events", out var eventsArray)) return events;

        int index = 0;
        foreach (var evt in eventsArray.EnumerateArray())
        {
            var raceEvent = ParseRaceEvent(evt, index);
            if (raceEvent != null)
            {
                events.Add(raceEvent);
            }
            index++;
        }

        return events.OrderBy(e => e.ScheduledDate ?? DateTime.MaxValue).ToList();
    }

    private RaceEvent? ParseRaceEvent(JsonElement evt, int index)
    {
        try
        {
            var raceSetup = evt.GetProperty("RaceSetup");
            var track = raceSetup.GetProperty("Track").GetString() ?? "";
            var trackLayout = raceSetup.GetProperty("TrackLayout").GetString() ?? "";

            // Parse scheduled date
            DateTime? scheduledDate = null;
            if (evt.TryGetProperty("Scheduled", out var scheduled))
            {
                var dateStr = scheduled.GetString();
                if (!string.IsNullOrEmpty(dateStr) && !dateStr.StartsWith("0001"))
                {
                    if (DateTime.TryParse(dateStr, out var parsed))
                        scheduledDate = parsed;
                }
            }

            // Parse sessions
            var sessions = new List<SessionInfo>();
            int raceLaps = 0;
            if (raceSetup.TryGetProperty("Sessions", out var sessionsObj))
            {
                foreach (var session in sessionsObj.EnumerateObject())
                {
                    var s = session.Value;
                    var sessionType = session.Name switch
                    {
                        "PRACTICE" => "Practice",
                        "QUALIFY" => "Qualifying",
                        "RACE" => "Race",
                        "CHAMPIONSHIP-PRACTICE" => "Championship Practice",
                        _ => session.Name
                    };

                    var laps = s.TryGetProperty("Laps", out var lapsEl) ? lapsEl.GetInt32() : 0;
                    var time = s.TryGetProperty("Time", out var timeEl) ? timeEl.GetInt32() : 0;

                    if (session.Name == "RACE")
                        raceLaps = laps;

                    sessions.Add(new SessionInfo
                    {
                        Type = sessionType,
                        DurationMinutes = time,
                        Laps = laps
                    });
                }
            }

            // Check completion status - if event has results, it's completed
            bool isCompleted = false;
            if (evt.TryGetProperty("Sessions", out var completedSessions) && completedSessions.ValueKind == JsonValueKind.Array)
            {
                foreach (var s in completedSessions.EnumerateArray())
                {
                    if (s.TryGetProperty("Results", out var results) && results.TryGetProperty("Result", out var resultArr) && resultArr.GetArrayLength() > 0)
                    {
                        isCompleted = true;
                        break;
                    }
                }
            }

            // Parse weather graphics and map to sessions using each weather entry's Sessions array
            var weatherGraphics = new List<string>();
            // Build a map of session key -> list of weather graphics
            var sessionWeatherMap = new Dictionary<string, List<string>>();
            if (raceSetup.TryGetProperty("Weather", out var weatherObj) && weatherObj.ValueKind == JsonValueKind.Object)
            {
                foreach (var weather in weatherObj.EnumerateObject())
                {
                    if (!weather.Name.StartsWith("WEATHER_")) continue;

                    var wValue = weather.Value;
                    var gStr = "";
                    if (wValue.TryGetProperty("Graphics", out var graphics))
                        gStr = graphics.GetString() ?? "";

                    if (string.IsNullOrEmpty(gStr)) continue;
                    weatherGraphics.Add(gStr);

                    // Each weather entry has a "Sessions" array listing which sessions it belongs to
                    if (wValue.TryGetProperty("Sessions", out var weatherSessions) && weatherSessions.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var ws in weatherSessions.EnumerateArray())
                        {
                            var sessionKey = ws.GetString() ?? "";
                            if (string.IsNullOrEmpty(sessionKey)) continue;

                            if (!sessionWeatherMap.ContainsKey(sessionKey))
                                sessionWeatherMap[sessionKey] = new List<string>();
                            sessionWeatherMap[sessionKey].Add(gStr);
                        }
                    }
                }
            }

            // Assign weather graphics to matching sessions
            foreach (var session in sessions)
            {
                // Find the raw session key for this session
                var rawKey = session.Type switch
                {
                    "Practice" => "PRACTICE",
                    "Qualifying" => "QUALIFY",
                    "Race" => "RACE",
                    "Championship Practice" => "CHAMPIONSHIP-PRACTICE",
                    _ => session.Type
                };

                if (sessionWeatherMap.TryGetValue(rawKey, out var weatherList))
                    session.WeatherGraphics = weatherList;
            }

            // Add sessions for weather-only session types not in RaceSetup.Sessions
            // (e.g., CHAMPIONSHIP-PRACTICE might not be listed as a session but has weather)
            var existingRawKeys = sessions.Select(s => s.Type switch
            {
                "Practice" => "PRACTICE",
                "Qualifying" => "QUALIFY",
                "Race" => "RACE",
                "Championship Practice" => "CHAMPIONSHIP-PRACTICE",
                _ => s.Type
            }).ToHashSet();

            foreach (var kvp in sessionWeatherMap)
            {
                if (!existingRawKeys.Contains(kvp.Key))
                {
                    var sessionType = kvp.Key switch
                    {
                        "PRACTICE" => "Practice",
                        "QUALIFY" => "Qualifying",
                        "RACE" => "Race",
                        "CHAMPIONSHIP-PRACTICE" => "Championship Practice",
                        _ => kvp.Key
                    };

                    sessions.Add(new SessionInfo
                    {
                        Type = sessionType,
                        WeatherGraphics = kvp.Value
                    });
                }
            }

            // Format track name nicely
            var trackName = FormatTrackName(track);
            var trackConfig = FormatTrackName(trackLayout);

            return new RaceEvent
            {
                EventIndex = index,
                TrackName = trackName,
                TrackConfig = trackConfig,
                ScheduledDate = scheduledDate,
                Laps = raceLaps,
                IsCompleted = isCompleted,
                Sessions = sessions,
                WeatherGraphics = weatherGraphics
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to parse event at index {Index}", index);
            return null;
        }
    }

    public async Task<RaceResult?> GetLastRaceResultAsync()
    {
        var doc = await GetExportDataAsync();
        if (doc == null) return null;

        var root = doc.RootElement;
        if (!root.TryGetProperty("Events", out var eventsArray)) return null;

        // Go through events in reverse to find the last completed race
        var eventsArr = eventsArray.EnumerateArray().ToArray();
        for (int i = eventsArr.Length - 1; i >= 0; i--)
        {
            var evt = eventsArr[i];
            if (!evt.TryGetProperty("Sessions", out var sessions) || sessions.ValueKind != JsonValueKind.Array) continue;

            foreach (var session in sessions.EnumerateArray())
            {
                if (!session.TryGetProperty("Type", out var typeEl)) continue;
                var sessionType = typeEl.GetString();
                if (sessionType != "RACE") continue;

                if (!session.TryGetProperty("Results", out var results)) continue;
                if (!results.TryGetProperty("Result", out var resultArr)) continue;
                if (resultArr.GetArrayLength() == 0) continue;

                // Found a completed race!
                var raceSetup = evt.GetProperty("RaceSetup");
                var track = raceSetup.GetProperty("Track").GetString() ?? "";
                var trackLayout = raceSetup.GetProperty("TrackLayout").GetString() ?? "";

                DateTime raceDate = DateTime.MinValue;
                if (evt.TryGetProperty("Scheduled", out var sched))
                {
                    var ds = sched.GetString();
                    if (!string.IsNullOrEmpty(ds) && !ds.StartsWith("0001"))
                        DateTime.TryParse(ds, out raceDate);
                }

                var driverResults = new List<DriverResult>();
                int pos = 1;
                foreach (var r in resultArr.EnumerateArray())
                {
                    var bestLapMs = r.TryGetProperty("BestLap", out var bl) ? bl.GetInt64() : 0;
                    var totalTimeMs = r.TryGetProperty("TotalTime", out var tt) ? tt.GetInt64() : 0;

                    driverResults.Add(new DriverResult
                    {
                        Position = pos++,
                        DriverName = r.TryGetProperty("DriverName", out var dn) ? dn.GetString() ?? "" : "",
                        CarModel = r.TryGetProperty("CarModel", out var cm) ? cm.GetString() ?? "" : "",
                        BestLap = FormatLapTime(bestLapMs),
                        TotalTime = FormatRaceTime(totalTimeMs),
                        HasPenalty = r.TryGetProperty("HasPenalty", out var hp) && hp.GetBoolean(),
                        PenaltyTime = r.TryGetProperty("PenaltyTime", out var pt) ? FormatLapTime(pt.GetInt64()) : "",
                        LapPenalty = r.TryGetProperty("LapPenalty", out var lp) ? lp.GetInt32() : 0,
                        Disqualified = r.TryGetProperty("Disqualified", out var dq) && dq.GetBoolean(),
                        BallastKg = r.TryGetProperty("BallastKG", out var bk) ? bk.GetInt32() : 0
                    });
                }

                return new RaceResult
                {
                    TrackName = FormatTrackName(track),
                    TrackConfig = FormatTrackName(trackLayout),
                    Date = raceDate,
                    SessionType = "Race",
                    Results = driverResults
                };
            }
        }

        return null;
    }

    private static string FormatTrackName(string internalName)
    {
        if (string.IsNullOrEmpty(internalName)) return "";
        // Replace underscores and prefixes
        var name = internalName
            .Replace("ks_", "")
            .Replace("csp/", "")
            .Replace("layout_", "")
            .Replace("_", " ");

        // Title case
        return System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(name);
    }

    private static string FormatLapTime(long milliseconds)
    {
        if (milliseconds <= 0) return "-";
        var ts = TimeSpan.FromMilliseconds(milliseconds);
        return ts.Minutes > 0
            ? $"{ts.Minutes}:{ts.Seconds:D2}.{ts.Milliseconds:D3}"
            : $"{ts.Seconds}.{ts.Milliseconds:D3}";
    }

    private static string FormatRaceTime(long milliseconds)
    {
        if (milliseconds <= 0) return "-";
        var ts = TimeSpan.FromMilliseconds(milliseconds);
        if (ts.Hours > 0)
            return $"{ts.Hours}:{ts.Minutes:D2}:{ts.Seconds:D2}.{ts.Milliseconds:D3}";
        return $"{ts.Minutes}:{ts.Seconds:D2}.{ts.Milliseconds:D3}";
    }
}
