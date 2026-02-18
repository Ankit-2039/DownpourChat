import { useChat } from '../context/ChatContext';
import { encryptMessage } from '../crypto/cryptoUtils';

export function useEncryption() {
  const { cryptoKey } = useChat();

  const encrypt = async (plaintext) => {
    if (!cryptoKey) throw new Error('No crypto key available');
    return encryptMessage(plaintext, cryptoKey);
  };

  return { encrypt };
}
