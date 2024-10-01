import React, { useState } from 'react';

// Modal Component
const ActionsModal = ({ lastRaiseAmount, onClose, onActionSelect }) => {
    const [raiseAmount, setRaiseAmount] = useState(lastRaiseAmount);
    const options = ['Call', 'Raise', 'Fold'];
    const [showRaiseInput, setShowRaiseInput] = useState(false);

    const handleRaiseChange = (e) => {
        setRaiseAmount(Number(e.target.value)); // עדכון סכום ההעלאה
    };

    const handleActionSelect = (action) => {
        if (action === 'Raise') {
            setShowRaiseInput(true); // הצגת שדה העלאה במקום לשלוח את הפעולה מיד
        } else {
            onActionSelect(action, raiseAmount); // שליחת הפעולה אם זו לא העלאה
        }
    };

    const confirmRaise = () => {
        if (raiseAmount <= lastRaiseAmount) {
            alert('Raise amount must be higher than the last raise');
            return;
        }
        setShowRaiseInput(false);
        onActionSelect('Raise', raiseAmount); // שליחת פעולה רק לאחר אישור
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Choose an Action</h3>
                {options.map(option => (
                    <button key={option} onClick={() => handleActionSelect(option)}>
                        {option === 'Call' ? `Call (${lastRaiseAmount})` : option}
                    </button>
                ))}

                {/* הצגת שדה העלאה רק אם נבחרה האפשרות Raise */}
                {showRaiseInput && (
                    <div>
                        <input
                            type="number"
                            value={raiseAmount}
                            onChange={handleRaiseChange}
                            placeholder={`Enter raise amount (min ${lastRaiseAmount + 1})`}
                        />
                        <button onClick={confirmRaise}>Confirm Raise</button>
                    </div>
                )}
                <button onClick={onClose}>Cancel</button>
            </div>
        </div>
    );
};

export default ActionsModal;
