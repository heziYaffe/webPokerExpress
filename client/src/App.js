import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Home from './pages/Home/Home';
import GamePage from './pages/GamePage/GamePage';



const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<Home />} /> {/* Example for a homepage */}
                <Route path="/texas-holdem" element={<GamePage />} />


            </Routes>
        </Router>
    );
};

export default App;
