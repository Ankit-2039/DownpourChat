import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { deriveKey } from '../crypto/cryptoUtils';

const API = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export default function JoinRoom() {
  const { setRoomId, setUsername, setCryptoKey } = useChat();
  const navigate = useNavigate();

  const [mode, setMode]           = useState('join'); // 'join' | 'create'
  const [roomInput, setRoomInput] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!usernameInput.trim()) return setError('Username is required');
    if (!passphrase.trim())    return setError('Passphrase is required');
    if (mode === 'join' && !roomInput.trim()) return setError('Room ID is required');

    setLoading(true);

    try {
      let finalRoomId;

      if (mode === 'create') {
        const res = await fetch(`${API}/api/rooms/create`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to create room');
        const data = await res.json();
        finalRoomId = data.roomId;
      } else {
        const res = await fetch(`${API}/api/rooms/join`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: roomInput.trim() }),
        });
        if (!res.ok) throw new Error('Room not found');
        finalRoomId = roomInput.trim();
      }

      // Derive key AFTER we have roomId (used as salt)
      const key = await deriveKey(passphrase.trim(), finalRoomId);

      setRoomId(finalRoomId);
      setUsername(usernameInput.trim());
      setCryptoKey(key);
      navigate('/chat');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="join-room">
      <div className="join-room__card">
        <h1>Downpour Chat</h1>
        <p className="join-room__subtitle">End-to-end encrypted. Anonymous. Impermanent.</p>

        <div className="tab-switcher">
          <button className={mode === 'join' ? 'active' : ''} onClick={() => setMode('join')}>Join Room</button>
          <button className={mode === 'create' ? 'active' : ''} onClick={() => setMode('create')}>Create Room</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <label>
            Username
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Anonymous"
              maxLength={30}
              autoComplete="off"
            />
          </label>

          {mode === 'join' && (
            <label>
              Room ID
              <input
                type="text"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                placeholder="Paste room ID"
                autoComplete="off"
              />
            </label>
          )}

          <label>
            Passphrase
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Shared code for this room"
              autoComplete="new-password"
            />
          </label>

          {error && <p className="error">{error}</p>}

          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'create' ? 'Create & Enter' : 'Join Room'}
          </button>
        </form>
      </div>
    </div>
  );
}
