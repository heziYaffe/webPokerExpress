import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import './GamePage.css';
import PlayerPanel from '../../games/PlayerPanel/PlayerPanel';
import PokerTable from '../../games/PokerTable/PokerTable';
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

    const { roomId } = useParams(); // Get the room ID from the URL
    const { connectedPlayer } = usePlayer(); // Access the connected player's information
    const [gameState, setGameState] = useState({
        players: [],
        communityCards: [],
        pot: 0,
        chips: 0,
        status: 'waiting',
        currentPlayer: 0
    });

    const updateCommunityCards = (newCards) => {
        setGameState(prevState => ({
            ...prevState,
            communityCards: [...prevState.communityCards, ...newCards] // הוספת הקלפים החדשים לקיימים
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
        console.log("current player", gameState.currentPlayer % 3);
    }, [gameState]);

    useEffect(() => {
        console.log("playerCards:", playerCards);
    }, [playerCards]);

    
    const updateGameState = (data) => {

            console.log("in updateGameState", data)
            setGameState(prevState => {
                return {
                    players: data.players || prevState.players,
                    communityCards: data.communityCards || prevState.communityCards,
                    pot: data.pot !== undefined ? data.pot : prevState.pot,
                    status: data.stage,
                    currentPlayer: data.currentPlayer,
                    chips: data.chips || prevState.chips
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

            if (data.type === 'startGame') {
                console.log("game started");
                startGame();
            }

            if (data.type === 'gameUpdate') {
                console.log("update game", data.state);
                updateGameState(data.state)

                //fetchGameState()
            }


            /*if (data.type === 'gameState') {
                console.log("getGameState");
                console.log("set game state", data.state);
                console.log("player chips", data.state.chips);

                setPlayerChips(data.state.chips)


            }*/

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

        };

        wsRef.current.onclose = () => {
            console.log(`WebSocket connection closed for room ${roomId}`);
        };

        // Clean up the WebSocket when the component unmounts
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [roomId]);
    
    // Start game function to send WebSocket message to start the game
    const startGame = () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'startGame',
                roomId: roomId,
            }));
            console.log('Game start request sent via WebSocket');
        }
    };


    const handlePlayerAction = async (action) => {
        /*if (gameState.status !== 'in-game') {
            console.log("The game hasn't started yet.");
            return; // אם המשחק לא התחיל, פשוט אל תעשה כלום
        }*/
    
        // בדוק אם החיבור ל-WebSocket פעיל
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            // שלח את הודעת הפעולה לשרת דרך ה-WebSocket
            wsRef.current.send(JSON.stringify({
                type: 'playerAction',
                action: action, // הפעולה כמו 'fold', 'raise' וכו'
                playerId: connectedPlayer.id, // מזהה השחקן
                currentPlayer: gameState.currentPlayer % gameState.players.length, // השחקן הנוכחי
            }));
    
            console.log(`Sent player action: ${action} to server via WebSocket`);
        } else {
            console.error('WebSocket is not connected');
        }
    };
    


    return (
        <div className='gameBackground'>
            <div className="game-container">
                <h1 className='game-name'>Texas Hold'em</h1>
                <button onClick={startGame} className="start-game-btn">Start Game</button>
                <div className="poker-table">
                    <PokerTable communityCards={gameState.communityCards}/>
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

        {/* PlayerPanel Actions */}
        {gameState.players[gameState.currentPlayer] && connectedPlayer?.id === gameState.players[gameState.currentPlayer].userId && gameState.status < 4 && (
            <PlayerPanel player={gameState.players[gameState.currentPlayer]} onAction={handlePlayerAction} />
        )}
    </div>


    </div>
    );
};

export default GamePage;
