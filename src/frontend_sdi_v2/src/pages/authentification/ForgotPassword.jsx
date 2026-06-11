import {useNavigate} from "react-router-dom";
import './ForgotPassword.css'
import MakiLogo from "../../assets/MAKI.png";
import {useState} from "react";
import {BASE_URL} from "../../config.js";

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");

    function handleLogin() {
        navigate('/login');
    }

    async function handleNextStep(username) {
        try {
            const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: "include",
                body: JSON.stringify({username: username})
            });

            if (response.ok){
                const data = await response.json();
                localStorage.setItem("reset_token",data.token);
                navigate('/next-step');
            }
            else{
                console.error("Username doesn't match database:", response.statusText);
            }
        }
        catch (error) {
            console.error("Error during registration:", error);
        }
    }

    return(
        <div className="forgot-container">
            <div className="image1-title">
                <img src = {MakiLogo} alt= "logo_maki" className="logo-maki"/>
                <h1>Reset password!</h1>
            </div>
            <div className = "mail-pass-login-combo">
                <div className="mail">
                    <p>Username: </p>
                    <input type="text" placeholder="Type your username here..." onChange={(e) => setUsername(e.target.value)} />
                </div>
                <div className="login-section">
                    <button className="login-button" onClick={()=>handleNextStep(username)}>Send!</button>
                    <span className="signup-link" onClick={()=>handleLogin()}>Back to log-in!</span>
                </div>
            </div>
        </div>
    )
}