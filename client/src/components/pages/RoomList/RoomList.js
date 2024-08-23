import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './RoomList.css'; // New CSS file for the RoomList component

const RoomList = () => {
    const { game } = useParams();
    const [rooms, setRooms] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch the list of active rooms for this game from the server
        // For now, we'll use a placeholder array to simulate this
        const fetchedRooms = [
            { id: 1, name: 'Room 1', players: 4, maxPlayers: 6 },
            { id: 2, name: 'Room 2', players: 3, maxPlayers: 6 },
            // Add more rooms here as needed
        ];
        setRooms(fetchedRooms);
    }, [game]);

    const handleCreateRoom = () => {
        // Logic to create a new room
        // For now, just simulate creating a room
        const roomId = rooms.length + 1
        const newRoom = { id: roomId, name: `Room ${rooms.length + 1}`, players: 1, maxPlayers: 6 };
        setRooms([...rooms, newRoom]);
        navigate(`/game/${roomId}`);

    };

    const handleJoinRoom = (roomId) => {
        // Navigate to the room's game page
        navigate(`/game/${roomId}`);
    };

    return (
        <div className="room-list-container">
            <h2>{game.replace('-', ' ').toUpperCase()} Rooms</h2>
            <ul className="room-list">
                {rooms.map(room => (
                    <li key={room.id} className="room-item">
                        <p>{room.name}</p>
                        <p>Players: {room.players}/{room.maxPlayers}</p>
                        <button onClick={() => handleJoinRoom(room.id)}>Join Room</button>
                    </li>
                ))}
            </ul>
            <button className="create-room-button" onClick={handleCreateRoom}>Create New Room</button>
        </div>
    );
};

export default RoomList;
