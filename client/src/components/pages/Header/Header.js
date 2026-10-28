import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import './Header.css';
import { usePlayer } from '../../../context/PlayerContext';

const Header = () => {
    const { connectedPlayer, logout } = usePlayer();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <header className="site-header">
            <div className="site-header__inner">
                <Link to="/" className="brand" aria-label="Poker Express home">
                    <span className="brand__mark" aria-hidden="true">♠</span>
                    <span>Poker<span className="brand__accent">Express</span></span>
                </Link>

                {connectedPlayer && (
                    <nav className="site-nav" aria-label="Main">
                        <NavLink to="/lobby" className="site-nav__link">Lobby</NavLink>
                        {connectedPlayer.role === 'admin' && (
                            <NavLink to="/admin" className="site-nav__link">Admin</NavLink>
                        )}
                    </nav>
                )}

                <div className="site-header__actions">
                    {connectedPlayer ? (
                        <>
                            <span className="user-chip" title="Signed in">
                                <span className="user-chip__avatar" aria-hidden="true">{connectedPlayer.name?.[0]?.toUpperCase()}</span>
                                <span className="user-chip__name">{connectedPlayer.name}</span>
                            </span>
                            <button onClick={handleLogout} className="btn btn-ghost">Log out</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-ghost">Sign in</Link>
                            <Link to="/register" className="btn btn-primary">Sign up</Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
