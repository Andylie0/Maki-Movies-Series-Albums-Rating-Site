import {useNavigate} from "react-router-dom"
import './Register.css'
import MakiLogo from "../../assets/MAKI.png";
import {useState} from "react";
import {BASE_URL} from "../../config.js";

export default function Register() {
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    async function handleSignUp(username, password, confirmPassword) {
        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }
        const payload = {
            username : username,
            password : password,
        }

        try{
            const response =  await fetch(`${BASE_URL}/auth/register`, {
                method : "POST",
                headers:  {"Content-Type": "application/json"},
                credentials: "include",
                body: JSON.stringify(payload),
            });

            if(response.ok)
                navigate('/login');
            else {
                console.error("Login failed:", response.statusText);
            }
        }
        catch (error) {
            console.error("Error during registration:", error);
        }


    }

    function handleLogin(){
        navigate('/login');
    }

    return(
        <div className="register-container">
            <div className="image-title">
                <img src = {MakiLogo} alt= "logo_maki" className="logo-maki"/>
                <h1>We are glad to have you!</h1>
            </div>
            <div className = "combo-signup">
                <div className="user">
                    <p>Username: </p>
                    <input type="text" placeholder="Type your username here..."  onChange={(e) => setUsername(e.target.value)}/>
                </div>
                <div className="password">
                    <p>Password: </p>
                    <input type="password" placeholder="Type your password here..." onChange={(e) => setPassword(e.target.value)}/>
                </div>
                <div className="password">
                    <p>Confirm Password: </p>
                    <input type="password" placeholder="Rewrite your password here..." onChange={(e) => setConfirmPassword(e.target.value)}/>
                </div>
                <div className="signup-section">
                    <button className="register-button" onClick={() => handleSignUp(username,password,confirmPassword)}>Register!</button>
                    <span className="login-link" onClick={() => handleLogin()}>Already have an account? Back to log in.</span>
                </div>
            </div>
        </div>
    )
}