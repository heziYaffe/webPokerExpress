import React from 'react';
import './Card.css';

const suitSymbols = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
};

const Card = ({ rank, suit }) => {
    const isRed = suit === 'hearts' || suit === 'diamonds';
    return (
        <div className={`card ${isRed ? 'red' : 'black'}`}>
            <span className="card-rank">{rank}</span>
            <span className="card-suit">{suitSymbols[suit]}</span>
        </div>
    );
};

export default Card;
