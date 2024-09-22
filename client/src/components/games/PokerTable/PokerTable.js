import React from 'react';
import './PokerTable.css';
import Card from '../Card/Card';

const PokerTable = ({ communityCards, pot }) => {
    
    return (
        <div>
            <img src="/assets/images/PokerTable.svg" alt="Poker Table" className="poker-table-svg" />

            {/* Display community cards */}
            <div className="community-cards">
                {communityCards.map((card, index) => (
                    <Card key={index} rank={card.rank} suit={card.suit} />
                ))}
            </div>

            {/* Display pot */}
            <div className="pot">
                <span>Pot: ${pot}</span>
            </div>
        </div>
    );
};

export default PokerTable;
