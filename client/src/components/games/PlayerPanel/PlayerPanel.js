import React from 'react';
import './PlayerPanel.css';
import Card from '../Card/Card';

const PlayerPanel = ({ player, onAction, playerCards}) => {

    return (
        <div className="player-panel">
            {/*
            <div className="cards">
                {playerCards.map((card, index) => (
                    <Card key={index} rank={card.rank} suit={card.suit} />
                ))}
            </div>
            */}
            <div className="chips">
                {/* Display the player's chips */}
                <p>Chips: ${player.chips}</p>
            </div>
            <div className="actions">
                <button onClick={() => onAction('Raise')} className="raise">RAISE</button>
                <button onClick={() => onAction('Check')} className="check">CHECK</button>
                <button onClick={() => onAction('Fold')} className="fold">FOLD</button>
            </div>
        </div>
    );
};

export default PlayerPanel;
