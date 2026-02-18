import { useChat } from '../context/ChatContext';

export default function TypingIndicator() {
  const { typingUsers } = useChat();

  if (typingUsers.length === 0) return null;

  const label =
    typingUsers.length === 1
      ? `${typingUsers[0]} is typing...`
      : `${typingUsers.slice(0, -1).join(', ')} and ${typingUsers.at(-1)} are typing...`;

  return (
    <div className="typing-indicator">
      <span className="typing-dots">
        <span /><span /><span />
      </span>
      <p>{label}</p>
    </div>
  );
}
