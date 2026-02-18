import { useState, useRef, useCallback } from 'react';
import { getSocket } from '../socket/socketClient';
import { useEncryption } from '../hooks/useEncryption';

const TYPING_DEBOUNCE_MS = 1000;

export default function MessageInput() {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const { encrypt } = useEncryption();
  const typingTimerRef = useRef(null);
  const isTypingRef = useRef(false);

  const emitTypingStop = useCallback(() => {
    if (isTypingRef.current) {
      getSocket()?.emit('typing:stop');
      isTypingRef.current = false;
    }
  }, []);

  const handleChange = (e) => {
    setText(e.target.value);
    const socket = getSocket();
    if (!socket) return;

    if (!isTypingRef.current) {
      socket.emit('typing:start');
      isTypingRef.current = true;
    }

    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(emitTypingStop, TYPING_DEBOUNCE_MS);
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    emitTypingStop();
    clearTimeout(typingTimerRef.current);

    try {
      const { ciphertext, iv } = await encrypt(trimmed);
      getSocket()?.emit('message:send', { ciphertext, iv });
      setText('');
    } catch (err) {
      console.error('Encryption failed:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="message-input">
      <textarea
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Type a message... (Enter to send)"
        rows={1}
        disabled={sending}
      />
      <button onClick={handleSend} disabled={!text.trim() || sending}>
        Send
      </button>
    </div>
  );
}
