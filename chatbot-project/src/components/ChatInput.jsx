import React from 'react'
import { useState } from 'react';
import { Chatbot } from 'supersimpledev';

function ChatInput({ chatMessages, setChatMessages }) {
    const [inputText, setInputText] = useState("");

    function saveInputText(event) {
        setInputText(event.target.value);
    }

    function sendMessage() {
        if (!inputText.trim()) return;

        const newChatMessages = [
            ...chatMessages,
            {
                message: inputText,
                sender: "user",
                id: crypto.randomUUID()
            }
        ];
        setChatMessages(newChatMessages);

        const response = Chatbot.getResponse(inputText);
        setChatMessages([
            ...newChatMessages,
            {
                message: response,
                sender: "robot",
                id: crypto.randomUUID()
            }
        ]);

        setInputText("");
    }

    return (
        <div className="chat-input-container">
            <input
                placeholder="Type your message here..."
                onChange={saveInputText}
                value={inputText}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />

            <button
                onClick={sendMessage}
                className="send-button">
                Send
            </button>
        </div>
    );
}

export default ChatInput;