import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './GamePage.css';
import PlayerPanel from '../../games/PlayerPanel/PlayerPanel';
import PokerTable from '../../games/PokerTable/PokerTable';
import Player from '../../games/Player/Player';
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
    const [currentPlayer, setCurrentPlayer] = useState(0); // State for tracking whose turn it is
    const [gameState, setGameState] = useState({
        players: [],
        communityCards: [],
        pot: 0,
        status: 'waiting',
    });

    useEffect(() => {
        console.log("GameState has changed:", gameState);
        console.log("players:", gameState.players);

    }, [gameState]);

    useEffect(() => {
        console.log("currentPlayer changed:", currentPlayer);
    }, [currentPlayer]);

    
    const updateGameState = (data) => {
        console.log("data in updateGameState: " ,data)
        // Only update if there is a difference
        if (!_.isEqual(gameState.players, data.players) ||
            !_.isEqual(gameState.communityCards, data.communityCards) ||
            gameState.pot !== data.pot) {
            
            setGameState(prevState => {
                return {
                    ...prevState, // Ensure that other parts of the state are preserved
                    players: data.players || prevState.players,
                    communityCards: data.communityCards || prevState.communityCards,
                    pot: data.pot !== undefined ? data.pot : prevState.pot,
                };
            });
        }
    }
    
    
    useEffect(() => {

        const token = localStorage.getItem('token'); // Retrieve the token from localStorage

        console.log("useEffect is running to fetch game state");
        // Fetch initial game state (including players and cards) from the server
        const fetchGameState = async () => {
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
        fetchGameState();

                // Establish WebSocket connection
                const ws = new WebSocket(`ws://localhost:5003`);

                ws.onopen = () => {
                    console.log('WebSocket connection opened');
                };
        
                ws.onmessage = (message) => {
                    console.log('Received WebSocket message:', message.data);
                    const data = JSON.parse(message.data);
                    updateGameState(data);
                };
        
                ws.onclose = () => {
                    console.log('WebSocket connection closed');
                };
        
                // Cleanup WebSocket on component unmount
                return () => {
                    ws.close();
                };
    }, [roomId]);
    

    const handlePlayerAction = async (action) => {
        const token = localStorage.getItem('token'); // Retrieve the token from localStorage
    
        // Send the player's action to the server
        const response = await fetch(`http://localhost:5003/api/games/${roomId}/action`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`  // Include the token in the Authorization header
            },
            body: JSON.stringify({ action, playerId: connectedPlayer.id }),
        });
    
        const updatedGameState = await response.json();
        setGameState(updatedGameState);
    
        console.log("currentPlayer before change:", currentPlayer);

        // Advance to the next player's turn
        setCurrentPlayer((prevPlayer) => (prevPlayer + 1) % gameState.players.length);
    };
    

    console.log("connectedPlayer?.id ", connectedPlayer?.id)
    console.log("currentPlayer ", currentPlayer)
    console.log("gameState.players ", gameState.players)

    ///FOR TESTS////

    // useEffect to log the updated state after it changes
    useEffect(() => {
        console.log("after nextPlayer", currentPlayer);
    }, [currentPlayer]);
    ///FOR TESTS///

    return (
        <div className='gameBackground'>
            <div className="game-container">
                <h1 className='game-name'>Texas Hold'em</h1>
                <div className="poker-table">
                    <PokerTable/>
                    {gameState.players.map((player, index) => (                                           
                        <div key={index} className={`player player-${index + 1}`}>
                            <Player name={player.player}/>
                        </div>
                    ))}
                </div>
            </div>

        {/* Show PlayerPanel only for the current player if the player exists */}
        {gameState.players[currentPlayer] && connectedPlayer?.id === gameState.players[currentPlayer].player && (
            <PlayerPanel player={gameState.players[currentPlayer]} onAction={handlePlayerAction} />
        )}
        </div>
    );
};

export default GamePage;
