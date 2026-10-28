import React from 'react';
import './Card.css';

const SUIT_SYMBOLS = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };

/** A playing card. Pass `hidden` for a face-down card. */
const Card = ({ rank, suit, hidden = false, size = 'md' }) => {
    if (hidden || !rank) {
        return <div className={`playing-card playing-card--back playing-card--${size}`} aria-label="Face-down card" />;
    }
    const isRed = suit === 'hearts' || suit === 'diamonds';
    return (
        <div className={`playing-card playing-card--${size} ${isRed ? 'is-red' : 'is-black'}`} aria-label={`${rank} of ${suit}`}>
            <span className="playing-card__corner">{rank}<br />{SUIT_SYMBOLS[suit]}</span>
            <span className="playing-card__suit" aria-hidden="true">{SUIT_SYMBOLS[suit]}</span>
        </div>
    );
};

export default Card;
