import React, { useState } from 'react';
import './ActionsModal.css';

/** Shown when another player raised and this player must respond. */
const ActionsModal = ({ lastRaiseAmount, toCall, onActionSelect }) => {
    const [raiseAmount, setRaiseAmount] = useState(lastRaiseAmount);
    const [showRaiseInput, setShowRaiseInput] = useState(false);
    const invalid = !Number.isInteger(raiseAmount) || raiseAmount < lastRaiseAmount;

    return (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="raise-title">
            <div className="modal panel actions-modal">
                <span className="eyebrow">Your move</span>
                <h2 id="raise-title">A player raised</h2>
                <p className="muted">Call {toCall ?? lastRaiseAmount} to stay in, re-raise, or fold.</p>
                {showRaiseInput ? (
                    <div className="field">
                        <label htmlFor="reraise">Raise by (min {lastRaiseAmount})</label>
                        <input id="reraise" className="input" type="number" min={lastRaiseAmount} value={raiseAmount}
                            onChange={(e) => setRaiseAmount(Number(e.target.value))} autoFocus />
                    </div>
                ) : null}
                <div className="modal-actions">
                    <button className="btn btn-ghost" onClick={() => onActionSelect('Fold')}>Fold</button>
                    {showRaiseInput ? (
                        <button className="btn btn-accent" disabled={invalid} onClick={() => onActionSelect('Raise', raiseAmount)}>Confirm raise</button>
                    ) : (
                        <button className="btn btn-accent" onClick={() => setShowRaiseInput(true)}>Raise…</button>
                    )}
                    <button className="btn btn-primary" onClick={() => onActionSelect('Call')}>Call {toCall ?? ''}</button>
                </div>
            </div>
        </div>
    );
};

export default ActionsModal;
