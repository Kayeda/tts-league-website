import './Footer.css';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container footer-inner">
                <div className="footer-brand">
                    <span className="footer-title">Try To Survive</span>
                    <p className="footer-tagline">Assetto Corsa Racing League — Season 2026</p>
                </div>
                <div className="footer-links">
                    <a
                        href="http://trytosurvive.servegame.com:8772/live-timing?server=0"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Live Timing
                    </a>
                    <a
                        href="https://acstuff.ru/s/q:race/online/join?httpPort=8081&ip=trytosurvive.servegame.com"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Join Server
                    </a>
                    <a
                        href="http://trytosurvive.servegame.com:8772/championship/a680ac2c-5c26-475b-8319-25396357c5ef?server=0"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Server Manager
                    </a>
                </div>
                <div className="footer-bottom">
                    <p>© 2026 TTS Racing League. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
