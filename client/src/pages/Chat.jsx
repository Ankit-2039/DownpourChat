import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatWindow from '../components/ChatWindow';
import { useChat } from '../context/ChatContext';

export default function Chat() {
  const { roomId, cryptoKey } = useChat();
  const navigate = useNavigate();

  useEffect(() => {
    if (!roomId || !cryptoKey) navigate('/');
  }, [roomId, cryptoKey]);

  if (!roomId || !cryptoKey) return null;

  return <ChatWindow />;
}
