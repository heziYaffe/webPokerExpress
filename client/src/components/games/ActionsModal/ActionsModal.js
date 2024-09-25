import React, { useState } from 'react';

// Modal Component
const ActionsModal = ({lastRaiseAmount, onClose, onActionSelect }) => {
    const options = ['Call', 'Raise', 'Fold']
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Choose an Action</h3>
                {options.map(option => (
                    <button key={option} onClick={() => onActionSelect(option)}>
                        {option === 'call' ? `Call (${lastRaiseAmount})` : option.toUpperCase()}
                    </button>
                ))}
                <button onClick={onClose}>Cancel</button>
            </div>
        </div>
    );
};

export default ActionsModal;
