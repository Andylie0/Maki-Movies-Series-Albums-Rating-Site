import {BASE_URL, WB_URL} from "../../config.js";
import {useEffect, useRef, useState} from "react";
import './About.css'

export default function Chat() {
    const isAdmin = JSON.parse(localStorage.getItem('user'))?.role === "admin";

    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const chatEndRef = useRef(null);
    const storedUser = JSON.parse(localStorage.getItem('user')) || { username: "Guest" };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        fetch(`${BASE_URL}/chat/history`)
            .then(res => res.json())
            .then(data => setMessages(data || []))
            .catch(err => console.error("NoSQL History Error:", err));

        const socket = new WebSocket(`${WB_URL}/ws`);

        socket.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type === "CHAT_MESSAGE") {
                setMessages(prev => [...prev, msg.data]);
            }
        };

        return () => socket.close();
    }, []);

    const sendChatMessage = async (overrideText = null) => {
        const messageToSend = overrideText || chatInput;

        if(!messageToSend.trim)
            return;

        const payload = {
            username: storedUser.username,
            text: messageToSend
        };
        try {
            await fetch(`${BASE_URL}/chat/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: "include",
                body: JSON.stringify(payload)
            });
            setChatInput("");
        } catch (error) {
            console.error("Chat Send Error:", error);
        }
    }

    function AdminButton(){
        if (isAdmin){
            return(
                <div className="admin-controls">
                <button className="admin-button" onClick={() => sendChatMessage("WASSUP EVERYONE!!")}>WASSUP!!</button>
                </div>
            )
        }
    }

    return(
        <div>
            {isAdmin && (
                <div className="admin-controls">
                <button className="admin-button" onClick={() => sendChatMessage("WASSUP EVERYONE!!")}>WASSUP!!</button>
                </div>
            )}
            <div className="chat-container">
                <div className="chat-header">Sushi talk</div>
                <div className="chat-messages">
                    {messages.map((m, i) => (
                        <div key={i} className={`chat-bubble ${m.username === storedUser.username ? 'me' : 'other'}`}>
                            <span className="chat-user">{m.username}</span>
                            <p className="chat-text">{m.text}</p>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>
                <div className="chat-input-area">
                    <input
                        type="text"
                        placeholder="Say something..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                    />
                    <button onClick={() => sendChatMessage()}>Send</button>
                </div>
            </div>
        </div>
    )
}