import { createContext, useContext, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [roomId, setRoomId]       = useState(null);
  const [username, setUsername]   = useState('');
  const [anonId]                  = useState(() => uuidv4()); // stable per session
  const [cryptoKey, setCryptoKey] = useState(null);           // CryptoKey — never serialized
  const [messages, setMessages]   = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  const addMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const setTranscript = useCallback((msgs) => {
    setMessages(msgs);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setTypingUsers([]);
    setCryptoKey(null);
    setRoomId(null);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        roomId, setRoomId,
        username, setUsername,
        anonId,
        cryptoKey, setCryptoKey,
        messages, addMessage, setTranscript,
        typingUsers, setTypingUsers,
        clearChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
