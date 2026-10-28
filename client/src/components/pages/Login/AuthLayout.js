import { Link } from 'react-router-dom';
import './Login.css';

const AuthLayout = ({ title, subtitle, children, footer }) => (
    <div className="auth-page">
        <div
            className="auth-art"
            aria-hidden="true"
            style={{ backgroundImage: "linear-gradient(180deg, rgba(11,18,32,0.25), rgba(11,18,32,0.92)), url('/assets/Images/pokerRoomBackground.webp')" }}
        >
            <Link to="/" className="brand auth-brand">
                <span className="brand__mark">♠</span>
                <span>Poker<span className="brand__accent">Express</span></span>
            </Link>
            <div className="auth-art__quote">
                <h2>Real-time poker with friends.</h2>
                <p>Private rooms, live tables, no downloads.</p>
            </div>
        </div>
        <div className="auth-main">
            <div className="auth-card panel">
                <Link to="/" className="brand auth-brand--mobile">
                    <span className="brand__mark">♠</span>
                    <span>Poker<span className="brand__accent">Express</span></span>
                </Link>
                <h1>{title}</h1>
                {subtitle && <p className="muted auth-subtitle">{subtitle}</p>}
                {children}
                {footer && <p className="auth-footer">{footer}</p>}
            </div>
        </div>
    </div>
);

export default AuthLayout;
