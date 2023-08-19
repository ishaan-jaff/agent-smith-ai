import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';
import './App.css';

function App() {
  const [chatLog, setChatLog] = useState([]);
  const [question, setQuestion] = useState('');
  const [showFunctionMessages, setShowFunctionMessages] = useState(true);
  const ws = useRef(null);

  const getWebSocketUrl = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws/chat/`;
  }

  const getSessionId = () => {
    return localStorage.getItem("sessionId");
  }

  useEffect(() => {
    ws.current = new WebSocket(getWebSocketUrl());

    ws.current.onopen = () => console.log("ws opened");
    ws.current.onmessage = (e) => {
        const messageData = JSON.parse(e.data);
        setChatLog((prevLog) => [...prevLog, messageData]);
    };
    ws.current.onclose = () => {
        console.log("ws closed");
        // Here you can implement logic to handle a reconnect if necessary.
    };

    return () => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.close();
        }
    };
  }, []);

  const handleChat = () => {
    const message = {
        question: question,
        session_id: getSessionId()
    };

    if (ws.current.readyState !== WebSocket.OPEN) {
        console.error("WebSocket is not open. Can't send message.");
        // Optionally, you can implement logic here to handle a reconnect.
        return;
    }
    
    ws.current.send(JSON.stringify(message));
  };


  return (
    <div className="App">
      <div className="chatWindow">
        {chatLog.map((message, index) => {
          if (!showFunctionMessages && message.role === "function") {
            return null;
          }

          const content = message.content || (message.is_function_call ? `${message.func_name}(${JSON.stringify(message.func_arguments)})` : '');

          return (
            <div key={index} className={`message ${message.role}`}>
              <ReactMarkdown remarkPlugins={[gfm]}>{content}</ReactMarkdown>
            </div>
          );
        })}
      </div>
      <div className="chatInput">
        <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Type your message..."/>
        <button onClick={handleChat}>Send</button>
      </div>
      <label>
        <input type="checkbox" checked={showFunctionMessages} onChange={() => setShowFunctionMessages(!showFunctionMessages)} />
        Show function messages
      </label>
    </div>
  );
}

export default App;
