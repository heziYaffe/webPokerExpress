import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
    return (
        <header className="header">
            <div className="header-container">
                <h1 className="logo">PokerStars</h1>
                <nav>
                    <Link to="/login" className="btn">Sign In</Link>
                    <Link to="/register" className="btn">Sign Up</Link>
                </nav>
            </div>
        </header>
    );
};

export default Header;
