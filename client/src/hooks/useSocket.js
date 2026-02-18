import { useEffect, useRef } from 'react';
import { initSocket, disconnectSocket } from '../socket/socketClient';
import { decryptMessage } from '../crypto/cryptoUtils';
import { useChat } from '../context/ChatContext';

export function useSocket() {
  const { anonId, username, roomId, cryptoKey, addMessage, setTypingUsers } = useChat();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!roomId || !cryptoKey || !username) return;

    const socket = initSocket({ anonId, username, roomId });
    socketRef.current = socket;

    socket.on('message:receive', async ({ _id, username: sender, ciphertext, iv, createdAt }) => {
      try {
        const plaintext = await decryptMessage(ciphertext, iv, cryptoKey);
        addMessage({ _id, username: sender, text: plaintext, createdAt, own: sender === username });
      } catch {
        addMessage({ _id, username: sender, text: '[decryption failed]', createdAt, own: false, error: true });
      }
    });

    socket.on('typing:update', ({ typingUsers }) => {
      setTypingUsers(typingUsers.filter((u) => u !== username));
    });

    socket.on('user:joined', ({ username: u }) => {
      addMessage({ _id: Date.now(), system: true, text: `${u} joined the room` });
    });

    socket.on('user:left', ({ username: u }) => {
      addMessage({ _id: Date.now(), system: true, text: `${u} left the room` });
    });

    return () => disconnectSocket();
  }, [roomId, cryptoKey, username]);

  return socketRef;
}
