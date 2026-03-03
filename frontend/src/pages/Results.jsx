import { useState, useEffect } from 'react';
import { getLastRaceResult } from '../services/api';
import './Results.css';

export default function Results() {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const data = await getLastRaceResult();
                setResult(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) return <div className="loading"><div className="spinner"></div><p>Loading results...</p></div>;
    if (error) return <div className="error-state"><p>Failed to load results: {error}</p></div>;
    if (!result) return (
        <div className="page">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Race Results</h1>
                    <p className="page-subtitle">No race results available yet — the season hasn't started!</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="page">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Race Results</h1>
                    <p className="page-subtitle">
                        {result.trackName} {result.trackConfig && `— ${result.trackConfig}`}
                        {result.date && result.date !== '0001-01-01T00:00:00' && (
                            <> • {new Date(result.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}</>
                        )}
                    </p>
                </div>

                {/* Podium */}
                <div className="results-podium animate-in">
                    {result.results.slice(0, 3).map((r, i) => {
                        const colors = ['#FFD700', '#C0C0C0', '#CD7F32'];
                        return (
                            <div key={i} className={`podium-card podium-card-${i + 1}`} style={{ '--podium-color': colors[i] }}>
                                <span className="podium-card-pos">{i + 1}</span>
                                <h3 className="podium-card-name">{r.driverName}</h3>
                                <p className="podium-card-time">{r.totalTime}</p>
                                <p className="podium-card-best">Best: {r.bestLap}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Full Results Table */}
                <div className="results-table-section animate-in" style={{ animationDelay: '0.2s' }}>
                    <h2 className="section-title">Full Classification</h2>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Pos</th>
                                    <th>Driver</th>
                                    <th>Best Lap</th>
                                    <th>Total Time</th>
                                    <th>Penalties</th>
                                </tr>
                            </thead>
                            <tbody>
                                {result.results.map((r, i) => (
                                    <tr key={i} className={r.disqualified ? 'row-dq' : ''}>
                                        <td>
                                            <span className={`position-badge pos-${r.position <= 3 ? r.position : 'other'}`}>
                                                {r.position}
                                            </span>
                                        </td>
                                        <td className="td-driver">
                                            {r.driverName}
                                            {r.disqualified && <span className="badge badge-dq">DSQ</span>}
                                        </td>
                                        <td className="td-mono">{r.bestLap}</td>
                                        <td className="td-mono">{r.totalTime}</td>
                                        <td>
                                            {r.hasPenalty ? (
                                                <span className="penalty-info">
                                                    {r.penaltyTime !== '-' && r.penaltyTime !== '' && `+${r.penaltyTime}`}
                                                    {r.lapPenalty > 0 && `+${r.lapPenalty} lap(s)`}
                                                </span>
                                            ) : (
                                                <span className="no-penalty">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
