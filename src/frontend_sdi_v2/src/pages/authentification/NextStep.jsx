import MakiLogo from "../../assets/MAKI.png";
import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {BASE_URL} from "../../config.js";

export default function NextStep() {
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    async function handleLogin(password, confirmPassword) {
        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        const token = localStorage.getItem("reset_token");
        try{
            const response =  await fetch(`${BASE_URL}/auth/reset-password`, {
                method : "POST",
                headers:  {"Content-Type": "application/json"},
                credentials: "include",
                body: JSON.stringify({
                    token : token,
                    new_password: password}),
                }
            );
            if(response.ok) {
                localStorage.removeItem("reset_token");
                navigate('/login');
            }
            else {
                console.error("Resetting password failed:", response.statusText);
            }

        }
        catch (error) {
            console.error("Error during resetting password:", error);
        }

        navigate('/login');
    }

    return(
        <div className="register-container">
            <div className="image-title">
                <img src = {MakiLogo} alt= "logo_maki" className="logo-maki"/>
                <h1>Change Password!</h1>
            </div>
            <div className = "combo-signup">
                <div className="password">
                    <p>Password: </p>
                    <input type="password" placeholder="Type your password here..." onChange={(e) => setPassword(e.target.value)}/>
                </div>
                <div className="password">
                    <p>Confirm Password: </p>
                    <input type="password" placeholder="Rewrite your password here..." onChange={(e) => setConfirmPassword(e.target.value)}/>
                </div>
                <div className="signup-section">
                    <button className="register-button" onClick={() => handleLogin(password,confirmPassword)}>Change!</button>
                </div>
            </div>
        </div>
    )
}