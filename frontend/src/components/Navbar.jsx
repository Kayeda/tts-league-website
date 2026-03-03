import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useServer } from '../ServerContext';
import './Navbar.css';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const { serverKey, setServerKey, server } = useServer();

    const links = [
        { path: '/', label: 'Home' },
        { path: '/drivers', label: 'Drivers' },
        { path: '/calendar', label: 'Calendar' },
        { path: '/results', label: 'Results' },
    ];

    return (
        <nav className="navbar">
            <div className="container navbar-inner">
                <Link to="/" className="navbar-brand">
                    <img src="/logo.png" alt="TTS Logo" className="navbar-logo" />
                </Link>

                <button
                    className={`navbar-toggle ${isOpen ? 'active' : ''}`}
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                <div className={`navbar-menu ${isOpen ? 'open' : ''}`}>
                    {links.map(link => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`navbar-link ${location.pathname === link.path ? 'active' : ''}`}
                            onClick={() => setIsOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}

                    <div className="navbar-actions">
                        <a
                            href="https://docs.google.com/document/d/1eRzMsqK9Af8xDdTApNsqiU6fYoVkmu4ao-a0A8mzY0o/edit?usp=drive_link"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline btn-sm"
                        >
                            📖 TTS Manual
                        </a>
                        <a
                            href={server.liveTiming}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline btn-sm"
                        >
                            🔴 Live Timing
                        </a>
                        <a
                            href={server.joinServer}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline btn-sm"
                        >
                            🎮 Join Server
                        </a>
                        <div className="server-selector">
                            <select
                                id="server-select"
                                value={serverKey}
                                onChange={(e) => setServerKey(e.target.value)}
                                className="server-select"
                            >
                                <option value="main">🖥️ Main Server</option>
                                <option value="alt">🖥️ Alt Server</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
