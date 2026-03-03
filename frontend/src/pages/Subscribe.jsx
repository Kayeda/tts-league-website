import { useState } from 'react';
import './Subscribe.css';

export default function Subscribe() {
    const [formData, setFormData] = useState({
        name: '',
        steamId: '',
        team: '',
    });
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        const nameRegex = /^[a-zA-Z\s]+$/;
        if (!nameRegex.test(formData.name)) {
            return 'Name can only contain letters and spaces.';
        }

        const steamIdRegex = /^\d{17,18}$/; // Added 17 just in case user meant SteamID64 which is 17 digits, but it enforces numbers
        if (!/^\d{18}$/.test(formData.steamId)) {
            return 'SteamID must be exactly an 18-digit integer.';
        }

        if (!formData.team.trim()) {
            return 'Team name is required.';
        }

        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const error = validateForm();
        if (error) {
            setStatus({ type: 'error', message: error });
            return;
        }

        setStatus({ type: 'loading', message: 'Submitting your application...' });

        // Submit to Google Apps Script Web App
        const scriptURL = 'https://script.google.com/macros/s/AKfycbztJLuK2StHKlLtlZq3uVmtp3LyTLSs1JW2jA6SFIRPjoSYEJBg79gvYQzR1Qxbja42rg/exec';

        try {
            // Using URLSearchParams (x-www-form-urlencoded) is required by Google Apps Script doPost
            const data = new URLSearchParams();
            data.append('Name', formData.name);
            data.append('SteamID', formData.steamId);
            data.append('Team', formData.team);

            const response = await fetch(scriptURL, {
                method: 'POST',
                body: data,
                mode: 'no-cors' // Required for Google Scripts unless CORS is explicitly handled, though we won't get a readable response
            });

            // Since mode is 'no-cors', the response will feel "opaque" (status 0). We assume success if it didn't throw.
            setStatus({ type: 'success', message: 'Successfully registered! Your application has been sent.' });
            setFormData({ name: '', steamId: '', team: '' });
        } catch (error) {
            console.error('Error!', error.message);
            setStatus({ type: 'error', message: 'An error occurred while submitting. Please try again later.' });
        }

        // Clear success message after 5 seconds
        setTimeout(() => {
            setStatus({ type: '', message: '' });
        }, 5000);
    };

    return (
        <div className="page subscribe-page">
            <div className="container">
                <div className="subscribe-header animate-in">
                    <h1 className="page-title">Join the League</h1>
                    <p className="page-subtitle">Sign up for Try To Survive Season 2026</p>
                </div>

                <div className="subscribe-card card animate-in" style={{ animationDelay: '0.15s' }}>
                    {status.message && (
                        <div className={`status-message ${status.type}`}>
                            {status.type === 'error' && '⚠️ '}
                            {status.type === 'success' && '✅ '}
                            {status.type === 'loading' && '⏳ '}
                            {status.message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="subscribe-form">
                        <div className="form-group">
                            <label htmlFor="name">Driver Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. Lewis Hamilton"
                                required
                                pattern="[A-Za-z\s]+"
                                title="Only letters and whitespace allowed"
                            />
                            <small className="form-hint">Only letters and spaces are allowed.</small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="steamId">SteamID</label>
                            <input
                                type="text"
                                id="steamId"
                                name="steamId"
                                value={formData.steamId}
                                onChange={handleChange}
                                placeholder="e.g. 76561197960287930"
                                required
                                pattern="\d{18}"
                                maxLength="18"
                                title="Must be exactly 18 digits"
                            />
                            <small className="form-hint">Your 18-digit Steam ID for server whitelisting.</small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="team">Team</label>
                            <input
                                type="text"
                                id="team"
                                name="team"
                                value={formData.team}
                                onChange={handleChange}
                                placeholder="e.g. Mercedes-AMG Petronas"
                                required
                            />
                            <small className="form-hint">The team you wish to represent in the league.</small>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary btn-lg submit-btn" disabled={status.type === 'loading'}>
                                {status.type === 'loading' ? 'Submitting...' : '📝 Submit Application'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
