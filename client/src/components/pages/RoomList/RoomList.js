import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './RoomList.css'; // New CSS file for the RoomList component

const RoomList = () => {
    const { game } = useParams();
    const [rooms, setRooms] = useState([]);
    const [showModal, setShowModal] = useState(false); // State to control modal visibility
    const [roomName, setRoomName] = useState(''); // State for room name
    const [maxPlayers, setMaxPlayers] = useState(6); // State for max players
    const navigate = useNavigate();

    const token = localStorage.getItem('token'); // Retrieve the token from localStorage

    useEffect(() => {
        const fetchRooms = async () => {
            try {

                const response = await fetch(`http://localhost:5003/api/rooms/${game}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`  // Include the token in the Authorization header
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log("data: ", data)
                    console.log("rooms: ", rooms)

                    setRooms(data);
                } else {
                    console.error('Failed to fetch rooms:', response.statusText);
                }
            } catch (error) {
                console.error('Error fetching rooms:', error);
            }
        };
        fetchRooms();
    }, [game]);
    

    const handleCreateRoom = async () => {

        try {
            const response = await fetch('http://localhost:5003/api/rooms/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`  // Include the token in the Authorization header
                },
                body: JSON.stringify({ name: roomName, gameType: game, maxPlayers: maxPlayers }),
            });
    
            if (response.ok) {
                const newRoom = await response.json();
                setRooms([...rooms, newRoom]);
                navigate(`/game/${newRoom._id}`);
            } else {
                console.error('Failed to create room:', response.statusText);
            }
        } catch (error) {
            console.error('Error creating room:', error);
        }
    };
    
    

    const handleJoinRoom = async (roomId) => {

        try {
            const response = await fetch(`http://localhost:5003/api/rooms/${roomId}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`  // Include the token in the Authorization header
                }
            });
    
            if (response.ok) {                
                // Navigate to the room's game page
                navigate(`/game/${roomId}`);
            } else {
                console.error('Failed to join room:', response.statusText);
            }
        } catch (error) {
            console.error('Error joining room:', error);
        }

    };

    const handleModalSubmit = (e) => {
        e.preventDefault();
        handleCreateRoom();
        setShowModal(false); // Close the modal after submission
    };

    return (
        <div className="room-list-container">
            <h2>{game.replace('-', ' ').toUpperCase()} Rooms</h2>
            <ul className="room-list">
                {rooms.map(room => (
                    <li key={room.id} className="room-item">
                        <p>{room.name}</p>
                        <p>Players: {room.gameState.playerCards.length}/{room.maxPlayers}</p>
                        <button onClick={() => handleJoinRoom(room._id)}>Join Room</button>
                    </li>
                ))}
            </ul>
            <button className="create-room-button" onClick={() => setShowModal(true)}>Create New Room</button>

            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Create New Room</h3>
                        <form onSubmit={handleModalSubmit}>
                            <label>
                                Room Name: 
                                <input
                                    type="text"
                                    value={roomName}
                                    onChange={(e) => setRoomName(e.target.value)}
                                    required
                                />
                            </label>
                            <label>
                                Max Players: 
                                <input
                                    type="number"
                                    value={maxPlayers}
                                    onChange={(e) => setMaxPlayers(e.target.value)}
                                    min="2"
                                    max="6"
                                    required
                                />
                            </label>
                            <button type="submit">Create Room</button>
                            <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomList;
