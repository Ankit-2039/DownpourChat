import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import { useSocket } from '../hooks/useSocket';
import { useChat } from '../context/ChatContext';
import { decryptMessage } from '../crypto/cryptoUtils';

export default function ChatWindow() {
  const { roomId, username, cryptoKey, clearChat, setTranscript, messages } = useChat();
  const navigate = useNavigate();
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  useSocket();

  // Load transcript on mount
  useEffect(() => {
    if (!roomId || !cryptoKey) return;

    const loadTranscript = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}/api/transcript/${roomId}`,
          { credentials: 'include' }
        );
        const { messages } = await res.json();

        const decrypted = await Promise.all(
          messages.map(async (msg) => {
            try {
              const text = await decryptMessage(msg.ciphertext, msg.iv, cryptoKey);
              return { ...msg, text, own: msg.username === username };
            } catch {
              return { ...msg, text: '[decryption failed]', error: true };
            }
          })
        );

        setTranscript(decrypted);
      } catch (err) {
        console.error('Failed to load transcript:', err);
      }
    };

    loadTranscript();
  }, [roomId, cryptoKey]);

  const downloadTranscript = () => {
    const exportData = messages
      .filter((msg) => !msg.system)
      .map((msg) => ({
        username: msg.username,
        message:  msg.text,
        time:     new Date(msg.createdAt).toISOString(),
      }));

    const blob = new Blob(
      [JSON.stringify({ roomId, exportedAt: new Date().toISOString(), messages: exportData }, null, 2)],
      { type: 'application/json' }
    );

    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = `transcript-${roomId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLeaveClick = () => setShowLeaveDialog(true);

  const handleDownloadAndLeave = () => {
    downloadTranscript();
    clearChat();
    navigate('/');
  };

  const handleLeaveOnly = () => {
    clearChat();
    navigate('/');
  };

  return (
    <div className="chat-window">
      <header className="chat-header">
        <div>
          <h2>Room: <code>{roomId}</code></h2>
          <span className="chat-header__user">You are <strong>{username}</strong></span>
        </div>
        <button className="btn btn--danger" onClick={handleLeaveClick}>Leave</button>
      </header>

      <main className="chat-body">
        <MessageList />
        <TypingIndicator />
      </main>

      <footer className="chat-footer">
        <MessageInput />
      </footer>

      {showLeaveDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>Download Transcript?</h3>
            <p>Do you want to download a copy of this chat before leaving?</p>
            <p className="dialog__note">The file will be unencrypted plain JSON.</p>
            <div className="dialog__actions">
              <button className="btn btn--primary" onClick={handleDownloadAndLeave}>
                Download & Leave
              </button>
              <button className="btn btn--secondary" onClick={handleLeaveOnly}>
                Leave Without Downloading
              </button>
              <button className="btn btn--ghost" onClick={() => setShowLeaveDialog(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
