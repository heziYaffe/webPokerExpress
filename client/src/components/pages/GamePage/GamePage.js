import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import './GamePage.css';
import PlayerPanel from '../../games/PlayerPanel/PlayerPanel';
import PokerTable from '../../games/PokerTable/PokerTable';
import ActionsModal from '../../games/ActionsModal/ActionsModal';

import Player from '../../games/Player/Player';
import Card from '../../games/Card/Card';
import { usePlayer } from '../../../context/PlayerContext';
import _ from 'lodash';

const deepEqual = (obj1, obj2) => {
    if (obj1 === obj2) return true;

    if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
        return false;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    console.log("keys1:", keys1)
    console.log("keys2:", keys2)


    if (keys1.length !== keys2.length) return false;

    for (let key of keys1) {
        if (!keys2.includes(key)) return false;

        if (!deepEqual(obj1[key], obj2[key])) return false;
    }

    return true;
};


const GamePage =  () => {
    
    const navigate = useNavigate(); // Initialize the navigate hook

    const [lastRaiseAmount, setLastRaiseAmount] = useState(0);
    const [showActionsModal, setShowActionsModal] = useState(false);

    const [showConfetti, setShowConfetti] = useState(false);
    const [showDefeat, setShowDefeat] = useState(false);
    const [winner, setWinner] = useState(null);

    const { roomId } = useParams(); // Get the room ID from the URL
    const { connectedPlayer } = usePlayer(); // Access the connected player's information
    const [gameStarted, setGameStarted] = useState(false); // סטייט חדש לניהול מצב התחלת המשחק
    const [gameState, setGameState] = useState({
        players: [],
        communityCards: [],
        pot: 0,
        chips: 0,
        status: 'waiting',
        currentPlayer: 0,
        manager: null
    });

    const updateCommunityCards = (newCards) => {
        setGameState(prevState => ({
            ...prevState,
            communityCards: [...prevState.communityCards, ...newCards] // הוספת הקלפים החדשים לקיימים
        }));
    };

    const updateRoomManager = (roomManager) => {
        setGameState(prevState => ({
            ...prevState,
            manager: roomManager // הוספת הקלפים החדשים לקיימים
        }));
    };
    
    
    // Create a ref to store the WebSocket instance
    const wsRef = useRef(null);

    const [playerCards, setPlayerCards] = useState(
        [
        //{ rank: 'A', suit: 'hearts' },
        //{ rank: 'K', suit: 'spades' }
        ]
    );

    //const [playerChips, setPlayerChips] = useState()

    useEffect(() => {
        //setPlayerChips(100)
        console.log("GameState has changed:", gameState);
        console.log("current player", gameState.currentPlayer % gameState.players.length);
    }, [gameState]);

    useEffect(() => {
        console.log("playerCards:", playerCards);
    }, [playerCards]);

    
    const leaveRoom = () => {
        const confirmed = window.confirm('Are you sure you want to leave the room?');
        
        if (confirmed) {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    type: 'leaveRoom',
                    roomId: roomId,
                    playerId: connectedPlayer.id
                }));
    
                console.log('Player left the room.');
                
                // סגירת חיבור ה-WebSocket לאחר עזיבת החדר
                wsRef.current.close();
    
                console.log('Redirecting to lobby');
                navigate("/lobby");
            } else {
                console.error('WebSocket is not connected');
            }
        } else {
            console.log('Player decided to stay in the room.');
        }
    };
    

    const updateGameState = (data) => {

            console.log("in updateGameState", data)
            setGameState(prevState => {
                return {
                    players: data.players || prevState.players,
                    communityCards: data.communityCards || prevState.communityCards,
                    pot: data.pot !== undefined ? data.pot : prevState.pot,
                    status: data.stage,
                    currentPlayer: data.currentPlayer,
                    chips: data.chips || prevState.chips,
                    manager: prevState.manager
                };
            });

    }

    /*const setGameStateFromServer = (data) => {

        setGameState(prevState => {
            return {
                pot: data.pot !== undefined ? data.pot : prevState.pot,

                currentPlayer: data.currentPlayer,
            };
        });

    }*/
    
    
     // Fetch initial game state (including players and cards) from the server
     const fetchGameState = async () => {

        const token = localStorage.getItem('token'); // Retrieve the token from localStorage

        try {
            const response = await fetch(`http://localhost:5003/api/games/${roomId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`  // Include the token in the Authorization header
                }
            });               
            const data = await response.json();
            if (response.ok) {
                updateGameState(data);
            } else {
                console.error('Failed to fetch game state:', data.message);
            }
        } catch (error) {
            console.error('Network error:', error);
        }
    };


    const generateConfetti = () => {
        const confettiContainer = document.getElementById('confetti-container');
        if (confettiContainer) {
        const confettiColors = ['#FFC700', '#FF0000', '#2E3192', '#41BBC7', '#FFFFFF'];
        const numConfetti = 100; // Adjust as needed

        for (let i = 0; i < numConfetti; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('confetti-piece');

            // Randomize color
            confetti.style.backgroundColor =
            confettiColors[Math.floor(Math.random() * confettiColors.length)];

            // Random horizontal position
            confetti.style.left = Math.random() * 100 + 'vw';

            // Random animation duration and delay
            confetti.style.animationDuration = 2 + Math.random() * 3 + 's'; // Between 2-5 seconds
            confetti.style.animationDelay = Math.random() * 2 + 's'; // Between 0-2 seconds

            // Random horizontal movement
            const xMove = Math.random() * 200 - 100 + 'px'; // Between -100px to 100px
            confetti.style.setProperty('--x-move', xMove);

            confettiContainer.appendChild(confetti);

            // Remove confetti after animation ends
            setTimeout(() => {
            confetti.remove();
            }, 7000); // Adjust to match max animation duration
        }
        }
    };

    useEffect(() => {
        if (showConfetti) {
        generateConfetti();
        }
    }, [showConfetti]);

    useEffect(() => {
        console.log("Confetti state updated:", showConfetti);
    }, [showConfetti]);

    
    useEffect(() => {
        console.log("useEffect is running to fetch game state");

        //fetchGameState();
        
        
        // Establish WebSocket connection and store in the ref
        wsRef.current = new WebSocket(`ws://localhost:5003?roomId=${roomId}&token=${localStorage.getItem('token')}`);

        wsRef.current.onopen = () => {
            console.log(`WebSocket connection from ${connectedPlayer.id} opened for room ${roomId}`);
        };

        wsRef.current.onmessage = (message) => {
            console.log('Received WebSocket message:', message);

            // Parse the message data
            const data = JSON.parse(message.data);

            console.log('Received WebSocket message data parsed:', data);

            if (data.type === 'roomManager') {
                console.log("room manager is", data.manager);
                updateRoomManager(data.manager);
            }

            if (data.type === 'startGame') {
                console.log("game started");
                startGame();
                setGameStarted(true)
            }

            if (data.type === 'endGame') {
                console.log("game ended");
                setPlayerCards([])
                setGameStarted(false)
            }

            if (data.type === 'winners') {
                const winners = data.winners;

                // בדוק אם השחקן הנוכחי הוא מנצח או מפסיד
                if (winners.includes(connectedPlayer.id)) {
                    //setWinner(true);
                    setShowConfetti(true);
                } else {
                    //setWinner(false);
                    setShowDefeat(true);
                }

                // הסרת האנימציות לאחר 5 שניות
                setTimeout(() => {
                    setShowConfetti(false);
                    setShowDefeat(false);
                }, 5000);
            }

            if (data.type === 'gameUpdate') {
                console.log("update game", data.state);
                updateGameState(data.state)

                //fetchGameState()
            }

            if (data.type === 'playerCards') {
                console.log("set player cards", data.cards);
                setPlayerCards(data.cards)
            }


            if (data.type === 'flop') {
                console.log("set flop cards", data.cards);
                updateCommunityCards(data.cards)
            }

            if (data.type === 'turn') {
                console.log("set turn cards", data.cards);
                updateCommunityCards(data.cards)
            }

            if (data.type === 'river') {
                console.log("set river cards", data.cards);
                updateCommunityCards(data.cards)
            }

            if (data.type === "actionRequest") {
                console.log("action request for raise", data.lastRaiseAmount);

                // Show the modal with options and the last raise amount
                setLastRaiseAmount(data.lastRaiseAmount);
                setShowActionsModal(true);

            }

        };

        wsRef.current.onclose = () => {
            console.log(`WebSocket connection closed for room ${roomId}`);
            /*sendWebSocketMessage({
                type: 'playerLeft',
                roomId: roomId,
                playerId: connectedPlayer.id
            })*/
        };

        // Clean up the WebSocket when the component unmounts
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [roomId]);
    
    const sendWebSocketMessage = (message) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        } else {
            console.error('WebSocket is not open. Cannot send message.');
        }
    };

    // Start game function to send WebSocket message to start the game
    const startGame = () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'startGame',
                roomId: roomId,
            }));
            console.log('Game start request sent via WebSocket');
            setGameStarted(true)
        }
    };


    const handlePlayerAction = async (action, raiseAmount = 0) => {
        // If the game isn't in progress, do nothing
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            // Send the player action to the server via WebSocket
            wsRef.current.send(JSON.stringify({
                type: 'playerAction',
                action: action, // The action, such as 'Raise', 'Check', or 'Fold'
                raiseAmount: raiseAmount,  // Send the raise amount if it's a raise action
                playerId: connectedPlayer.id, // The player's ID
                currentPlayer: gameState.currentPlayer % gameState.players.length, // Current player
            }));
            
            console.log(`Sent player action: ${action} (Raise: ${raiseAmount}) to server via WebSocket`);
        } else {
            console.error('WebSocket is not connected');
        }
    };
    
    const handleActionSelect = (action, raiseAmount = 0) => {
        console.log("player choose to", action)
        setShowActionsModal(false); // Close the modal

        // If the game isn't in progress, do nothing
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            // Send the player action to the server via WebSocket
            wsRef.current.send(JSON.stringify({
                type: 'playerActionToRaise',
                action: action, // The action, such as 'Raise', 'Check', or 'Fold'
                raiseAmount: raiseAmount,
                playerId: connectedPlayer.id, // The player's ID
                currentPlayer: gameState.currentPlayer % gameState.players.length, // Current player
            }));


            /*
            wsRef.current.send(JSON.stringify({
                type: 'playerAction',
                action: action, // The action, such as 'Raise', 'Check', or 'Fold'
                raiseAmount: raiseAmount,
                playerId: connectedPlayer.id, // The player's ID
                currentPlayer: gameState.currentPlayer % gameState.players.length, // Current player
            }));
            */

            //console.log(`Sent player action: ${action} (Raise: ${raiseAmount}) to server via WebSocket`);
        } else {
            console.error('WebSocket is not connected');
        }

    };

    const closeModal = () => {
        setShowActionsModal(false);
    };


    return (
        <div className='gameBackground'>
            <div className="game-container">
                <h1 className='game-name'>Texas Hold'em</h1>
                                {/* הצגת אנימציה של הקונפטי */}
                    {showConfetti && <div id="confetti-container" className="confetti"></div>}

                    {/* הצגת הודעת הניצחון */}
                    {showConfetti && (
                        <div className='victory'>
                            Congratulations, You Win!
                        </div>
                    )}

                    {/* אנימציה להפסד למפסידים */}
                    {showDefeat && (
                        <div className="defeat">
                            You lost! The winner is: {winner}
                        </div>
                    )}

                {
                console.log("room manager: ", gameState.manager)}
                {console.log("connectedPlayer.id: ", connectedPlayer.id)}
                
                <div className="button-container">
                {gameState.manager === connectedPlayer.id && !gameStarted && (
                    <button onClick={startGame} className="start-game-btn">Start Game</button>
                )}
                <button onClick={leaveRoom} className="leave-room-btn">Leave Room</button>
                </div>
                <div className="poker-table">
                    <PokerTable communityCards={gameState.communityCards} pot={gameState.pot}/>
                    {gameState.players.map((player, index) => {
                        console.log(`Rendering player at index ${index}:`, player.username);
                        return (
                            <div key={index} className={`player player-${index + 1}`}>
                                <Player name={player.username}/>
                            </div>
                        );
                    })}

                </div>

            </div>

        {/* Debugging output */}
        {console.log('Current Player:', gameState.currentPlayer % gameState.players.length)}
        {console.log('Connected Player ID:', connectedPlayer?.id)}
        {console.log('Current Player Object:', gameState.players[gameState.currentPlayer % gameState.players.length])}
        {console.log('Should PlayerPanel render:', gameState.players[gameState.currentPlayer % gameState.players.length] && connectedPlayer?.id === gameState.players[gameState.currentPlayer % gameState.players.length].userId)}

        {/* PlayerPanel and Player Info (cards + chips) */}
        <div className="player-panel-container">
            {/* Player's Info: Cards and Chips */}
            <div className="player-info">
                <div className="player-cards">
                    {playerCards && playerCards.map((card, cardIndex) => (
                        <Card key={cardIndex} rank={card.rank} suit={card.suit} />
                    ))}
                </div>
                <div className="player-chips">
                    {/* Display the player's chips */}
                    <p>Chips: ${gameState.chips}</p>
                </div>
        </div>
        
        {/* Show Action Modal */}
        {showActionsModal && (
            <div className='actions-Modal'>

                <ActionsModal 
                    lastRaiseAmount={lastRaiseAmount} 
                    onActionSelect={handleActionSelect} 
                    onClose={closeModal} 
                />
            </div>)
            }

        {/* PlayerPanel Actions */}
        {gameState.players[gameState.currentPlayer] &&  !showActionsModal && connectedPlayer?.id === gameState.players[gameState.currentPlayer].userId && gameState.status < 4 && (
            <PlayerPanel player={gameState.players[gameState.currentPlayer]} onAction={handlePlayerAction} />
        )}
    </div>


    </div>
    );
};

export default GamePage;
