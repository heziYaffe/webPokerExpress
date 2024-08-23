import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';
import { usePlayer } from '../../../context/PlayerContext';

const Header = () => {
    const { connectedPlayer, logout } = usePlayer();

    return (
        <header className="header">
            <div className="header-container">
                <div className="logo-menu-container">
                    <h1 className="logo">PokerStars</h1>
                    {connectedPlayer && (
                        <nav className="menu-items">
                            <Link to="/about" className="menu-link">About</Link>
                            <span className="separator">|</span>
                            <Link to="/deposit" className="menu-link">Deposit</Link>
                        </nav>
                    )}
                </div>
                <nav className="user-actions">
                    {connectedPlayer ? (
                        <button onClick={logout} className="btn">Logout</button>
                    ) : (
                        <>
                            <Link to="/login" className="btn">Sign In</Link>
                            <Link to="/register" className="btn">Sign Up</Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Header;
