import { useState, useEffect } from 'react';
import { getUpcomingRaces } from '../services/api';
import './Calendar.css';

export default function Calendar() {
    const [races, setRaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const data = await getUpcomingRaces();
                setRaces(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) return <div className="loading"><div className="spinner"></div><p>Loading calendar...</p></div>;
    if (error) return <div className="error-state"><p>Failed to load calendar: {error}</p></div>;

    function getTimeUntil(dateStr) {
        const target = new Date(dateStr);
        const now = new Date();
        const diff = target - now;
        if (diff <= 0) return 'Started';
        const days = Math.floor(diff / 86400000);
        if (days > 0) return `${days}d`;
        const hours = Math.floor(diff / 3600000);
        return `${hours}h`;
    }

    function getWeatherIcon(graphicsStr) {
        if (!graphicsStr) return null;
        const str = graphicsStr.toLowerCase();
        if (str.includes("clear") || str.includes("few") || str.includes("scattered") || str.includes("sol_01") || str.includes("sol_02")) return "☀️";
        if (str.includes("cloud") || str.includes("broken") || str.includes("overcast") || str.includes("sol_03") || str.includes("sol_04")) return "☁️";
        if (str.includes("rain") || str.includes("drizzle") || str.includes("shower") || str.includes("storm") || str.includes("rain_")) return "🌧️";
        if (str.includes("thunder") || str.includes("lightning") || str.includes("heavy_storm")) return "⛈️";
        if (str.includes("fog") || str.includes("mist") || str.includes("sol_01_fog")) return "🌫️";
        if (str.includes("snow") || str.includes("sleet")) return "❄️";
        return "⛅"; // default if unknown
    }

    return (
        <div className="page">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Race Calendar</h1>
                    <p className="page-subtitle">{races.length} upcoming race{races.length !== 1 ? 's' : ''}</p>
                </div>

                {races.length === 0 ? (
                    <div className="empty-state">
                        <p>🏁 No upcoming races scheduled.</p>
                    </div>
                ) : (
                    <div className="calendar-list">
                        {races.map((race, i) => {
                            const date = race.scheduledDate ? new Date(race.scheduledDate) : null;
                            const isNext = i === 0;

                            return (
                                <div
                                    key={i}
                                    className={`calendar-item card animate-in ${isNext ? 'calendar-next' : ''}`}
                                    style={{ animationDelay: `${i * 0.06}s` }}
                                >
                                    {/* Date Box */}
                                    <div className="calendar-date-box">
                                        {date ? (
                                            <>
                                                <span className="calendar-month">
                                                    {date.toLocaleDateString('en-US', { month: 'short' })}
                                                </span>
                                                <span className="calendar-day">{date.getDate()}</span>
                                                <span className="calendar-weekday">
                                                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="calendar-tbd">TBD</span>
                                        )}
                                    </div>

                                    {/* Race Info */}
                                    <div className="calendar-info">
                                        <div className="calendar-info-top">
                                            {isNext && <span className="badge badge-accent">Next Race</span>}
                                            <h3 className="calendar-track">{race.trackName}</h3>
                                            {race.trackConfig && (
                                                <p className="calendar-config">{race.trackConfig}</p>
                                            )}
                                        </div>
                                        <div className="calendar-meta">
                                            {race.laps > 0 && <span>{race.laps} laps</span>}
                                            {date && (
                                                <span>
                                                    {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                            {race.sessions && race.sessions.some(s => s.weatherGraphics && s.weatherGraphics.length > 0) && (
                                                <div className="calendar-weather">
                                                    {race.sessions.filter(s => s.weatherGraphics && s.weatherGraphics.length > 0).map((session, sIndex) => (
                                                        <div key={sIndex} className="calendar-weather-session">
                                                            <span className="calendar-weather-label">{session.type}</span>
                                                            <div className="calendar-weather-icons">
                                                                {session.weatherGraphics.map((graphics, wIndex) => (
                                                                    <span key={wIndex} title={graphics.replace('sol_', '').replace(/_/g, ' ')}>
                                                                        {getWeatherIcon(graphics)}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Countdown */}
                                    {date && (
                                        <div className="calendar-countdown">
                                            <span className="calendar-countdown-value">{getTimeUntil(race.scheduledDate)}</span>
                                            <span className="calendar-countdown-label">until race</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
