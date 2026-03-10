import React from 'react'
import ChatInput from './components/ChatInput';
import ChatMessages from './components/ChatMessages';
import './App.css';



function App() {
  const [chatMessages, setChatMessages] = React.useState([
    {
      message: "Hi, I'm Green Lantern",
      sender: "robot",
      id: 'id2'

    }
  ]
  );

  return (
    <>
      <div className="chat-header">
        <h1>Hello Edem Ametepeh</h1>
        <p>Welcome to your Green Assistant</p>
      </div>

      <ChatInput
        chatMessages={chatMessages}
        setChatMessages={setChatMessages}
      />

      <ChatMessages
        chatMessages={chatMessages}
      />
    </>
  );
}


export default App
