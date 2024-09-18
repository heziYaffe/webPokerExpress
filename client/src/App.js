import React from 'react';
import { createRoot } from 'react-dom/client'; // Import createRoot from react-dom/client
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/pages/Login/Login';
import Register from './components/pages/Register/Register';
import Home from './components/pages/Home/Home';
import GamePage from './components/pages/GamePage/GamePage';
import AdminPanel from './components/pages/AdminPanel/AdminPanel';

import { PlayerProvider } from './context/PlayerContext';
import Lobby from './components/pages/Lobby/Lobby';
import RoomList from './components/pages/RoomList/RoomList';

// Define the App component first
const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<Home />} /> {/* Example for a homepage */}
                <Route path="/lobby" element={<Lobby />} />
                <Route path="/lobby/:game" element={<RoomList />} /> {/* Single dynamic route for all games */}
                <Route path="/game/:roomId" element={<GamePage />} /> {/* Single dynamic route for all games */}
                <Route path="/admin" element={<AdminPanel />} /> {/* Single dynamic route for all games */}

            </Routes>
        </Router>
    );
};

const container = document.getElementById('root');
const root = createRoot(container); // Create a root with the container element

root.render(
  <React.StrictMode>
    <PlayerProvider>
      <App />
    </PlayerProvider>
  </React.StrictMode>
);


export default App;
