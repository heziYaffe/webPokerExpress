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
        pot: 0
    });

    useEffect(() => {
        console.log("GameState has changed:", gameState);
    }, [gameState]);

    
    const updateGameState = (data) => {
    
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
        console.log("useEffect is running to fetch game state");
        // Fetch initial game state (including players and cards) from the server
        const fetchGameState = async () => {
            try {
                const response = await fetch(`http://localhost:5003/api/games/${roomId}`);
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
    }, [roomId]);
    

    const handlePlayerAction = async (action) => {
        const token = localStorage.getItem('token'); // Retrieve the token from localStorage
    
        // Send the player's action to the server
        const response = await fetch(`http://localhost:5003/api/games/${roomId}/action`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                //'Authorization': `Bearer ${token}`  // Include the token in the Authorization header
            },
            body: JSON.stringify({ action, playerId: connectedPlayer.id }),
        });
    
        const updatedGameState = await response.json();
        setGameState(updatedGameState);
    
        // Advance to the next player's turn
        setCurrentPlayer((prevPlayer) => (prevPlayer + 1) % gameState.players.length);
    };
    

    const players = [
        { name: 'Player 1', chips: 1000, id: "66bd0f0ddff1d5ea76841a55" },
        { name: 'Player 2', chips: 1000, id: "66bd0f0ddff1d5ea76841a55ff" },
        { name: 'Player 3', chips: 1000, id: "66bd0f0ddff1d5ea76841a55ff" },
        { name: 'Player 4', chips: 1000, id: "66bd0f0ddff1d5ea76841a55ff" }
    ];

    const nextPlayer = () => {
        setCurrentPlayer((prevPlayer) => (prevPlayer + 1) % players.length);
    };

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
                    {/*<img src="/assets/images/PokerTable.svg" alt="Poker Table" className="poker-table-svg" />*/}
                    <PokerTable/>
                    {players.map((player, index) => (
                        <div key={index} className={`player player-${index + 1}`}>
                            <Player name={player.name}/>
                            {/*<div className="player-info">
                                    <p>{player.name}</p>
                                </div> */}
                            {/*<div className="player-avatar">
                                <img src="/assets/images/playerAvatar.webp" alt="Avatar" />
                            </div>*/}
                            {/* Only show player info if it's the connected player 
                            {connectedPlayer?.id === player.id && (
                                <div className="player-info">
                                    <p>{player.name}</p>
                                </div> 
                            )*/}
                        </div>
                    ))}
                </div>
            </div>

            {/* Show PlayerPanel only for the current player */}
            {connectedPlayer?.id === players[currentPlayer].id && (
                <PlayerPanel player={players[currentPlayer]} onAction={handlePlayerAction} />
            )}
        </div>
    );
};

export default GamePage;
