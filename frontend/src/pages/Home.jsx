import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useServer } from '../ServerContext';
import { getChampionshipInfo, getUpcomingRaces, getLastRaceResult } from '../services/api';
import './Home.css';

export default function Home() {
    const { server } = useServer();
    const [championship, setChampionship] = useState(null);
    const [nextRace, setNextRace] = useState(null);
    const [lastResult, setLastResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [countdown, setCountdown] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const [info, races, result] = await Promise.all([
                    getChampionshipInfo(),
                    getUpcomingRaces(),
                    getLastRaceResult().catch(() => null),
                ]);
                setChampionship(info);
                if (races?.length > 0) setNextRace(races[0]);
                setLastResult(result);
            } catch (err) {
                console.error('Failed to fetch homepage data', err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    // Countdown timer
    useEffect(() => {
        if (!nextRace?.scheduledDate) return;
        const target = new Date(nextRace.scheduledDate);

        function update() {
            const now = new Date();
            const diff = target - now;
            if (diff <= 0) {
                setCountdown(null);
                return;
            }
            setCountdown({
                days: Math.floor(diff / 86400000),
                hours: Math.floor((diff % 86400000) / 3600000),
                minutes: Math.floor((diff % 3600000) / 60000),
                seconds: Math.floor((diff % 60000) / 1000),
            });
        }
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [nextRace]);

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="home">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-bg"></div>
                <div className="container hero-content">
                    <img src="/logo.png" alt="TTS Logo" className="hero-logo" />
                    <h1 className="hero-title">Try To Survive</h1>
                    <p className="hero-subtitle">Assetto Corsa Racing League — Season 2026</p>

                    {/* Quick Stats */}
                    {championship && (
                        <div className="hero-stats">
                            <div className="stat">
                                <span className="stat-value">{championship.numEntrants}</span>
                                <span className="stat-label">Drivers</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">{championship.numEvents}</span>
                                <span className="stat-label">Races</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">1</span>
                                <span className="stat-label">Class</span>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="hero-actions">
                        <Link to="/subscribe" className="btn btn-primary btn-lg">
                            📝 Subscribe Now
                        </Link>
                        <a
                            href="https://docs.google.com/document/d/1eRzMsqK9Af8xDdTApNsqiU6fYoVkmu4ao-a0A8mzY0o/edit?usp=drive_link"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline btn-lg"
                        >
                            📖 TTS Manual
                        </a>
                        <a
                            href={server.liveTiming}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline btn-lg"
                        >
                            🔴 Live Timing
                        </a>
                        <a
                            href={server.joinServer}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline btn-lg"
                        >
                            🎮 Join Server
                        </a>
                    </div>
                </div>
            </section>

            <div className="container">
                {/* Next Race Countdown */}
                {nextRace && (
                    <section className="next-race-section animate-in">
                        <h2 className="section-title">Next Race</h2>
                        <div className="next-race-card card">
                            <div className="next-race-info">
                                <h3 className="next-race-track">{nextRace.trackName}</h3>
                                {nextRace.trackConfig && (
                                    <p className="next-race-config">{nextRace.trackConfig}</p>
                                )}
                                <div className="next-race-details">
                                    {nextRace.laps > 0 && <span className="badge badge-accent">{nextRace.laps} Laps</span>}
                                    {nextRace.scheduledDate && (
                                        <span className="next-race-date">
                                            {new Date(nextRace.scheduledDate).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {countdown && (
                                <div className="countdown">
                                    <div className="countdown-item">
                                        <span className="countdown-value">{countdown.days}</span>
                                        <span className="countdown-label">Days</span>
                                    </div>
                                    <div className="countdown-separator">:</div>
                                    <div className="countdown-item">
                                        <span className="countdown-value">{String(countdown.hours).padStart(2, '0')}</span>
                                        <span className="countdown-label">Hours</span>
                                    </div>
                                    <div className="countdown-separator">:</div>
                                    <div className="countdown-item">
                                        <span className="countdown-value">{String(countdown.minutes).padStart(2, '0')}</span>
                                        <span className="countdown-label">Min</span>
                                    </div>
                                    <div className="countdown-separator">:</div>
                                    <div className="countdown-item">
                                        <span className="countdown-value">{String(countdown.seconds).padStart(2, '0')}</span>
                                        <span className="countdown-label">Sec</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Quick Links */}
                <section className="quick-links-section animate-in" style={{ animationDelay: '0.15s' }}>
                    <div className="grid grid-3">
                        <Link to="/drivers" className="quick-link card">
                            <span className="quick-link-icon">🏎️</span>
                            <h3>Drivers</h3>
                            <p>View all {championship?.numEntrants || ''} league drivers</p>
                        </Link>
                        <Link to="/calendar" className="quick-link card">
                            <span className="quick-link-icon">📅</span>
                            <h3>Calendar</h3>
                            <p>Upcoming race schedule</p>
                        </Link>
                        <Link to="/results" className="quick-link card">
                            <span className="quick-link-icon">🏆</span>
                            <h3>Results</h3>
                            <p>Latest race results</p>
                        </Link>
                    </div>
                </section>

                {/* Last Race Preview */}
                {lastResult && (
                    <section className="last-result-section animate-in" style={{ animationDelay: '0.3s' }}>
                        <div className="section-header">
                            <h2 className="section-title">Latest Race Result</h2>
                            <Link to="/results" className="section-link">View Full Results →</Link>
                        </div>
                        <div className="card">
                            <p className="last-result-track">
                                {lastResult.trackName} {lastResult.trackConfig && `— ${lastResult.trackConfig}`}
                            </p>
                            <div className="podium">
                                {lastResult.results.slice(0, 3).map((r, i) => (
                                    <div key={i} className={`podium-item podium-${i + 1}`}>
                                        <span className="podium-position">{['🥇', '🥈', '🥉'][i]}</span>
                                        <span className="podium-name">{r.driverName}</span>
                                        <span className="podium-time">{r.bestLap}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
