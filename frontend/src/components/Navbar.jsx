import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

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
                            href="http://trytosurvive.servegame.com:8772/live-timing?server=0"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline btn-sm"
                        >
                            🔴 Live Timing
                        </a>
                        <a
                            href="https://acstuff.ru/s/q:race/online/join?httpPort=8081&ip=trytosurvive.servegame.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary btn-sm"
                        >
                            🎮 Join Server
                        </a>
                    </div>
                </div>
            </div>
        </nav>
    );
}
