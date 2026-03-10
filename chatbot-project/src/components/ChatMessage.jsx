import robot from '../assets/robot.png';
import user from '../assets/user.png';

function ChatMessage({ message, sender }) {
    return (
        <div className={sender === "user" ? "chat-message user" : "chat-message robot"}>
            {sender === "robot" && (
                <img src={robot} className="avatar" alt="Robot" />
            )}
            <div className="message-bubble">
                {message}
            </div>
            {sender === "user" && (
                <img src={user} className="avatar" alt="User" />
            )}
        </div>
    );
}

export default ChatMessage;