import React, { useState } from 'react';
import './PlayerPanel.css';

const PlayerPanel = ({ player, onAction }) => {
    const [showRaiseModal, setShowRaiseModal] = useState(false);  // State to control modal visibility
    const [raiseAmount, setRaiseAmount] = useState(100);  // Default raise amount

    // Function to handle opening the raise modal
    const handleRaiseClick = () => {
        setShowRaiseModal(true);  // Show the raise modal when "Raise" is clicked
    };

    // Function to handle raising action
    const handleRaiseSubmit = () => {
        setShowRaiseModal(false);  // Close the modal after submitting
        onAction('Raise', raiseAmount);  // Pass the raise amount to the parent component
    };

    return (
        <div className="player-panel">
            <div className="chips">
                <p>Chips: ${player.chips}</p> {/* Display the player's chips */}
            </div>
            <div className="actions">
                <button onClick={handleRaiseClick} className="raise">RAISE</button>
                <button onClick={() => onAction('Check')} className="check">CHECK</button>
                <button onClick={() => onAction('Fold')} className="fold">FOLD</button>
            </div>

            {/* Modal for Raise */}
            {showRaiseModal && (
                <div className="player-panel-modal">
                    <div className="player-panel-modal-content">
                        <h3>Enter Raise Amount</h3>
                        <input
                            type="number"
                            value={raiseAmount}
                            onChange={(e) => setRaiseAmount(Number(e.target.value))}  // Update raise amount
                            min={100}  // You can customize this as needed
                        />
                        <div className="player-panel-modal-actions">
                            <button onClick={handleRaiseSubmit} className="confirm">CONFIRM</button>
                            <button onClick={() => setShowRaiseModal(false)} className="cancel">CANCEL</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlayerPanel;
