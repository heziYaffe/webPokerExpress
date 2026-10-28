import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import Login from './components/pages/Login/Login';
import Register from './components/pages/Register/Register';
import Home from './components/pages/Home/Home';
import GamePage from './components/pages/GamePage/GamePage';
import AdminPanel from './components/pages/AdminPanel/AdminPanel';
import Lobby from './components/pages/Lobby/Lobby';
import RoomList from './components/pages/RoomList/RoomList';
import ProtectedRoute from './components/ui/ProtectedRoute';

const App = () => (
    <Router>
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/lobby" element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
            <Route path="/lobby/:game" element={<ProtectedRoute><RoomList /></ProtectedRoute>} />
            <Route path="/game/:roomId" element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </Router>
);

export default App;
