import React from 'react';
import './GamePage.css';

const GamePage = () => {
    const players = [
        { name: 'Player 1', chips: 1000 },
        { name: 'Player 2', chips: 1000 },
        { name: 'Player 3', chips: 1000 },
        { name: 'Player 4', chips: 1000 }
    ];

    return (
        <div className="game-container">
            <h1>Texas Hold'em</h1>
            <div className="poker-table">
                <img src="/assets/images/PokerTable.svg" alt="Poker Table" className="poker-table-svg" />
                
                {players.map((player, index) => (
                    <div key={index} className={`player player-${index + 1}`}>
                        <div className="player-avatar">
                            <img src="/assets/images/playerAvatar.webp" alt="Avatar" />
                        </div>
                        <div className="player-info">
                            <p>{player.name}</p>
                            <p>Chips: {player.chips}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GamePage;
