// Login.js

import React, { useState } from 'react';
import Register from "../Register/Register";
import './Login.css';
import { useNavigate } from 'react-router-dom'; // Import useNavigate


const Login = ({handleSuccesfulLogin}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate(); // Initialize the navigation function

  const handleClick = () => {
    navigate('/register'); // Replace '/target-page' with the route you want to navigate to
   };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5003/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),      
      });
      const data = await response.json();
      console.log("response.ok", response.ok)
      if (response.ok) {
        console.log('Login successful:', data);
        handleSuccesfulLogin();
        // Handle successful login here (e.g., redirecting the user or storing the login token)
      } else {
        console.error('Login failed:', data.message);
        // Handle login errors (e.g., showing an error message to the user)
      }
    } catch (error) {
      console.error('Network error:', error);
      // Handle network errors
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
      <div className="register-link">
        <p>Don't have an account? <span onClick={handleClick} style={{color: 'blue', cursor: 'pointer', textDecoration: 'underline'}}>Register</span></p>
      </div>
    </div>) : 
    
    (
    <div>
      <Register setShowLogin={setShowLogin} />
    </div>
    )
    
    }
    
    </div>
  );
};

export default Login;
