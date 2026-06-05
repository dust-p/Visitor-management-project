import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import './styles/login.css'; 
import config from './config/config';
const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async () => {
        const auth = getAuth();

        
        try {
            const userCredential = await signInWithEmailAndPassword(auth, username, password);
            const idToken = await userCredential.user.getIdToken();
            const uid = userCredential.user.uid
            const response = await axios.post(`${config.API_BASE_URL}/login`, { idToken });
            console.log(response.data);

            const expirationDate = new Date();
            expirationDate.setHours(expirationDate.getHours() + 12); 
            document.cookie = `uid=${uid}; path=/; expires=${expirationDate.toUTCString()}; secure; samesite=strict;`;    
            document.cookie = `email=${response.data.email}; path=/; expires=${expirationDate.toUTCString()}; secure; samesite=strict;`;
            document.cookie = `role=${response.data.role}; path=/; expires=${expirationDate.toUTCString()}; secure; samesite=strict;`;
            document.cookie = `company =${response.data.company}; path=/; expires=${expirationDate.toUTCString()}; secure; samesite=strict;`;
            navigate('/dashboard');
        } catch (err) {
            if (err.response) {
                setError(err.response.data.error || 'Login failed.');
            } else {
                setError(`Email or Password incorrect!`);
            }
        }
    };
    
    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            handleLogin();
        }
    };

    return (
        <div className="login-container">
    <h1>Login</h1>
    <input
        type="text"
        placeholder="Email"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onKeyDown={handleKeyDown}
    />
    <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={handleKeyDown}
    />
    <button onClick={handleLogin}>Login</button>
    {error && <p>{error}</p>}
</div>

    );
};

export default Login;
