import React, { useState, useEffect, useRef } from 'react';
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
    const [gameState, setGameState] = useState({
        players: [],
        communityCards: [],
        pot: 0,
        status: 'waiting',
        currentPlayer: 0
    });
    // Create a ref to store the WebSocket instance
    const wsRef = useRef(null);

    useEffect(() => {
        console.log("GameState has changed:", gameState);
        console.log("current player", gameState.currentPlayer);
    }, [gameState]);

    
    const updateGameState = (data) => {
        //console.log("data in updateGameState: " ,data)
        // Only update if there is a difference
        /*if (!_.isEqual(gameState.players, data.players) ||
            !_.isEqual(gameState.communityCards, data.communityCards) ||
            gameState.pot !== data.pot || gameState.currentPlayer !== data.currentPlayer) {
            
            setGameState(prevState => {
                return {
                    players: data.players || prevState.players,
                    communityCards: data.communityCards || prevState.communityCards,
                    pot: data.pot !== undefined ? data.pot : prevState.pot,
                    status: data.status,
                    currentPlayer: data.currentPlayer,
                };
            });

            setCurrentPlayer(data.currentPlayer)
        }*/

            setGameState(prevState => {
                return {
                    players: data.players || prevState.players,
                    communityCards: data.communityCards || prevState.communityCards,
                    pot: data.pot !== undefined ? data.pot : prevState.pot,
                    status: data.status,
                    currentPlayer: data.currentPlayer,
                };
            });

    }
    
    
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

        fetchGameState();
        
        // Establish WebSocket connection and store in the ref
        wsRef.current = new WebSocket(`ws://localhost:5003?roomId=${roomId}`);

        wsRef.current.onopen = () => {
            console.log(`WebSocket connection from ${connectedPlayer.id} opened for room ${roomId}`);
        };

        wsRef.current.onmessage = (message) => {
            console.log('Received WebSocket message:', message.data);

            // Parse the message data
            const data = JSON.parse(message.data);

            console.log('Received WebSocket message data parsed:', data);

            fetchGameState()
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
    

    const handlePlayerAction = async (action) => {
        const token = localStorage.getItem('token'); // Retrieve the token from localStorage
    
        // Send the player's action to the server
        const response = await fetch(`http://localhost:5003/api/games/${roomId}/action`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`  // Include the token in the Authorization header
            },
            body: JSON.stringify({ action, playerId: connectedPlayer.id, currentPlayer: gameState.currentPlayer }),
        });
    
        const updatedGameState = await response.json();
        

        console.log("updateGameState ", updatedGameState)
        await fetchGameState()

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'playerAction',
                action: action,
                playerId: connectedPlayer.id,
                currentPlayer: gameState.currentPlayer,
            }));
        } else {
            console.error('WebSocket is not connected');
        }

    };

    return (
        <div className='gameBackground'>
            <div className="game-container">
                <h1 className='game-name'>Texas Hold'em</h1>
                <div className="poker-table">
                    <PokerTable/>
                    {gameState.players.map((player, index) => {
                        console.log(`Rendering player at index ${index}:`, player);
                        return (
                            <div key={index} className={`player player-${index + 1}`}>
                                <Player name={player.player}/>
                            </div>
                        );
                    })}

                </div>
            </div>

        {/* Debugging output */}
        {console.log('Current Player:', gameState.currentPlayer)}
        {console.log('Connected Player ID:', connectedPlayer?.id)}
        {console.log('Current Player Object:', gameState.players[gameState.currentPlayer])}
        {console.log('Should PlayerPanel render:', gameState.players[gameState.currentPlayer] && connectedPlayer?.id === gameState.players[gameState.currentPlayer].player)}

        {/* Show PlayerPanel only for the current player if the player exists */}
        {gameState.players[gameState.currentPlayer] && connectedPlayer?.id === gameState.players[gameState.currentPlayer].player && (
            <PlayerPanel player={gameState.players[gameState.currentPlayer]} onAction={handlePlayerAction} />
        )}
        </div>
    );
};

export default GamePage;
