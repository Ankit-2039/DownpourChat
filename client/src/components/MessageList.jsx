import { useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';

export default function MessageList() {
  const { messages } = useChat();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="message-list">
      {messages.map((msg) => {
        if (msg.system) {
          return (
            <div key={msg._id} className="message message--system">
              {msg.text}
            </div>
          );
        }
        return (
          <div key={msg._id} className={`message ${msg.own ? 'message--own' : 'message--other'}`}>
            <span className="message__username">{msg.username}</span>
            <p className={`message__text ${msg.error ? 'message__text--error' : ''}`}>
              {msg.text}
            </p>
            <span className="message__time">
              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
