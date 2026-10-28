import React, { useEffect, useState } from 'react';
import './PlayerPanel.css';

/** Action bar shown when it is the player's turn. */
const PlayerPanel = ({ chips, toCall = 0, minRaise = 1, onAction }) => {
    const [raiseAmount, setRaiseAmount] = useState(minRaise);
    useEffect(() => setRaiseAmount(minRaise), [minRaise]);

    const maxRaise = Math.max(0, chips - toCall);
    const canRaise = maxRaise >= minRaise;
    const invalidRaise = !Number.isInteger(raiseAmount) || raiseAmount < minRaise || raiseAmount > maxRaise;

    return (
        <div className="action-bar" role="group" aria-label="Your action">
            <button onClick={() => onAction('Fold')} className="btn btn-ghost action-fold">Fold</button>
            <button onClick={() => onAction('Check')} className="btn btn-primary">
                {toCall > 0 ? `Call ${Math.min(toCall, chips)}` : 'Check'}
            </button>
            <div className="raise-group">
                <input
                    className="input"
                    type="number"
                    aria-label="Raise amount"
                    value={raiseAmount}
                    min={minRaise}
                    max={maxRaise}
                    step={1}
                    disabled={!canRaise}
                    onChange={(e) => setRaiseAmount(Number(e.target.value))}
                />
                <button onClick={() => onAction('Raise', raiseAmount)} className="btn btn-accent" disabled={!canRaise || invalidRaise}>
                    Raise
                </button>
            </div>
        </div>
    );
};

export default PlayerPanel;
