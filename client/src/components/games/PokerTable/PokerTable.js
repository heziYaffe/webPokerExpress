import React from 'react';
import './PokerTable.css';
import Card from '../Card/Card';

const STAGE_LABELS = { '-1': 'Waiting for players', 0: 'Pre-flop', 1: 'Flop', 2: 'Turn', 3: 'River', 4: 'Showdown' };

/** The felt: community cards, pot and seats (children). */
const PokerTable = ({ communityCards = [], pot = 0, stage = -1, children }) => {
    const slots = Array.from({ length: 5 }, (_, i) => communityCards[i]);
    return (
        <div className="table-wrap">
            <div className="table-felt">
                <div className="table-center">
                    <span className="table-stage">{STAGE_LABELS[stage] ?? ''}</span>
                    <div className="community-cards">
                        {slots.map((card, i) => (card
                            ? <Card key={i} rank={card.rank} suit={card.suit} />
                            : <div key={i} className="card-slot" aria-hidden="true" />))}
                    </div>
                    <div className="pot" aria-live="polite">Pot <strong>{pot}</strong></div>
                </div>
            </div>
            {children}
        </div>
    );
};

export default PokerTable;
