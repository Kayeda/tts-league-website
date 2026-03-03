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
