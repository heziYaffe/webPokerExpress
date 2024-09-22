import React, { useState } from 'react';
import Register from "../Register/Register";
import './Login.css';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { usePlayer } from '../../../context/PlayerContext'; // Import PlayerContext

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003';

// Utility function to decode JWT token
const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState(''); // State to hold the error message
  const [isError, setIsError] = useState(false); // State to track if there is an error

  const navigate = useNavigate(); // Initialize the navigation function
  const { setConnectedPlayer } = usePlayer(); // Access setConnectedPlayer from context

  const handleClick = () => {
    navigate('/register'); // Replace '/target-page' with the route you want to navigate to
   };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),      
      });
      const data = await response.json();
      console.log("response.ok", response.ok);
      console.log('data', data);

      if (response.ok) {
        console.log('Login successful:', data);
        localStorage.setItem('token', data.token);
        const parsedJwt =  parseJwt(data.token);
        console.log("parsedJwt", parsedJwt);
        setConnectedPlayer({ id: parsedJwt.userId, name: parsedJwt.username });

        // Reset error state and navigate to lobby
        setIsError(false);
        setErrorMessage('');
        navigate('/lobby'); // Redirect to the game page after successful login
      } else {
        console.error('Login failed:', data.message);
        setErrorMessage('Invalid username or password. Please try again.');
        setIsError(true);
      }
    } catch (error) {
      console.error('Network error:', error);
      setErrorMessage('Network error. Please try again later.');
      setIsError(true);
    }
  };
  
  const [showLogin, setShowLogin] = useState(true); // true to show Login, false to show Register

  return (
    <div className="login-page">
      {showLogin ? (
      <div className="login-container">
        <h2>Casino</h2>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Login</button>
        </form>

        {/* Display the error message if there is an error */}
        {isError && (
          <p className="error-message">{errorMessage}</p>
        )}

        <div className="register-link">
          <p>Don't have an account? <span onClick={handleClick} style={{ color: 'blue', cursor: 'pointer', textDecoration: 'underline' }}>Register</span></p>
        </div>
      </div>
      ) : (
      <div>
        <Register setShowLogin={setShowLogin} />
      </div>
      )}
    </div>
  );
};

export default Login;
