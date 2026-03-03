import { useState, useEffect } from 'react';
import { getDrivers } from '../services/api';
import './Drivers.css';

// Team colors for visual distinction
const TEAM_COLORS = {
    'Red Bull Racing': '#3671C6',
    'Ferrari': '#E8002D',
    'Mercedes': '#27F4D2',
    'McLaren': '#FF8000',
    'Aston Martin': '#229971',
    'Alpine': '#FF87BC',
    'Williams': '#64C4FF',
    'Racing Bulls': '#6692FF',
    'Haas': '#B6BABD',
    'Cadillac': '#FFD700',
    'Audi': '#E0003C',
};

function getTeamColor(team) {
    return TEAM_COLORS[team] || '#e8713a';
}

export default function Drivers() {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const data = await getDrivers();
                setDrivers(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) return <div className="loading"><div className="spinner"></div><p>Loading drivers...</p></div>;
    if (error) return <div className="error-state"><p>Failed to load drivers: {error}</p></div>;

    // Group by team
    const teams = {};
    drivers.forEach(d => {
        if (!teams[d.team]) teams[d.team] = [];
        teams[d.team].push(d);
    });

    return (
        <div className="page">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Drivers</h1>
                    <p className="page-subtitle">Season 2026 — {drivers.length} drivers across {Object.keys(teams).length} teams</p>
                </div>

                <div className="drivers-grid grid grid-3">
                    {drivers.map((driver, i) => (
                        <div
                            key={driver.guid || i}
                            className="driver-card card animate-in"
                            style={{
                                '--team-color': getTeamColor(driver.team),
                                animationDelay: `${i * 0.05}s`,
                            }}
                        >
                            <div className="driver-card-accent" style={{ background: getTeamColor(driver.team) }}></div>
                            <div className="driver-card-body">
                                <div className="driver-avatar">
                                    {driver.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <div className="driver-info">
                                    <h3 className="driver-name">{driver.name}</h3>
                                    <p className="driver-team" style={{ color: getTeamColor(driver.team) }}>{driver.team}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
