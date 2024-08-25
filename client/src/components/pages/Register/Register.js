import React, {useState} from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

import './Register.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(''); // Define state for message
  const [isError, setIsError] = useState(false); // Define state for error flag
  const [loading, setLoading] = useState(false); // Optional: State for loading

  const navigate = useNavigate(); // Initialize the navigation function

  const handleClick = () => {
    navigate('/login'); // Replace '/target-page' with the route you want to navigate to
   };

  const handleRegister = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
          const response = await fetch(`${API_URL}/api/auth/register`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ username, password }),
          });
          const data = await response.json();
          if (response.ok) {
              setMessage('Registration successful!');
              setIsError(false);
              navigate('/login'); // Redirect to login page
          } else {
              console.error('Registration failed:', data.message);
              setMessage(`Registration failed: ${data.message}`);
              setIsError(true);
          }
      } catch (error) {
          console.error('Network error:', error);
          setMessage('Network error, please try again later.');
          setIsError(true);
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className='register-page'>
      <div className="register-container">
          <h2>Casino</h2>
          <form onSubmit={handleRegister}>
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
              <button type="submit" disabled={loading}>
                  {loading ? 'Registering...' : 'Register'}
              </button>
          </form>
          {message && (
              <p className={isError ? 'error' : 'success'}>
                  {message}
              </p>
          )}
          <p>Have an account? <span onClick={handleClick} style={{color: 'blue', cursor: 'pointer', textDecoration: 'underline'}}>Login</span></p>
      </div>
      </div>
  );
}

export default Register;
