import { useNavigate } from 'react-router-dom'
import './Login.css'
import MakiLogo from '../../assets/MAKI.png'
import hehe from '../../assets/michael-jackson-hee-hee.mp3'
import {useEffect, useState} from "react";
import {BASE_URL} from "../../config.js";
import Cookie from "js-cookie";

export function Login({setIsLoggedIn}){
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");

    const successHandleLogin = () => {
        setIsLoggedIn(true);
        navigate("/");
    }

    function handleForgotPassword() {
        navigate("/forgot-password");
    }

    async function handleLogin(username, password) {
        const payload = {
            username : username,
            password : password,
        }

        try {
            const response = await fetch(`${BASE_URL}/auth/login`, {
                method : "POST",
                headers:  {"Content-Type": "application/json"},
                credentials: "include",
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const userData = await response.json();
                localStorage.setItem("user", JSON.stringify(userData));
                Cookie.set('user', JSON.stringify(userData), { expires: 1/24 });
                successHandleLogin();
            } else {
                console.error("Login failed:", response.statusText);
                alert(`Login failed: ${response.statusText}`);
            }

        }
        catch (error) {
            console.error("Error during login:", error);
        }
    }

    const handleRegister = () => {
        navigate("/register");
    }



    return(
        <div className="login-container">
            <div className="image-title">
                <img src = {MakiLogo} alt= "logo_maki" className="logo-maki" onClick={() => navigate('/')}/>
                <h1>Welcome to Maki!</h1>
            </div>
            <div className = "mail-pass-login-combo">
                <div className="mail">
                    <p>Username: </p>
                    <input type="text" placeholder="Type your username here..." onChange={(e) => setUsername(e.target.value)} />
                </div>
                <div className="password">
                    <p>Password: </p>
                    <input type="password" placeholder="Type your password here..." onChange={(e) => setPassword(e.target.value)}/>
                    <span className="forgot-password" onClick={()=> handleForgotPassword()}>Forgot Password?</span>
                </div>
                <div className="login-section">
                    <button className="login-button" onClick={() => handleLogin(username, password)}>Log in!</button>
                    <span className="signup-link" onClick={() => handleRegister()}>Don’t have an account? Sign up</span>
                </div>
            </div>
        </div>
    )
}

export default Login