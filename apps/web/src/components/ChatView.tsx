import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';

interface ChatViewProps {
  userId: string;
}

export function ChatView({ userId }: ChatViewProps) {
  const { messages, contacts, sendMessage, device } = useStore();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const contact = contacts.get(userId);
  const chatMessages = messages.get(userId) || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const message = input.trim();
    setInput('');
    setSending(true);

    try {
      await sendMessage(userId, message);
    } catch (error) {
      console.error('Failed to send message:', error);
      setInput(message); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const groupMessagesByDate = () => {
    const groups: { date: string; messages: typeof chatMessages }[] = [];
    let currentDate = '';

    chatMessages.forEach((msg) => {
      const msgDate = new Date(msg.timestamp).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [] });
      }

      groups[groups.length - 1].messages.push(msg);
    });

    return groups;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
            {(contact?.name || userId)[0].toUpperCase()}
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">
              {contact?.name || userId.substring(0, 12)}
            </h2>
            <p className="text-xs text-gray-500">
              Uçtan uca şifreli
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1 text-green-600 text-xs">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Şifreli
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p>Henüz mesaj yok</p>
              <p className="text-sm mt-1">İlk mesajı gönder!</p>
            </div>
          </div>
        ) : (
          groupMessagesByDate().map((group, i) => (
            <div key={i}>
              {/* Date divider */}
              <div className="flex items-center justify-center my-4">
                <span className="px-3 py-1 bg-white rounded-full text-xs text-gray-500 shadow-sm">
                  {group.date}
                </span>
              </div>

              {/* Messages */}
              {group.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex mb-2 ${msg.isOutgoing ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      msg.isOutgoing
                        ? 'bg-primary-600 text-white rounded-br-md'
                        : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
                    }`}
                  >
                    <p className="break-words">{msg.content}</p>
                    <div className={`flex items-center justify-end gap-1 mt-1 ${
                      msg.isOutgoing ? 'text-white/70' : 'text-gray-400'
                    }`}>
                      <span className="text-[10px]">{formatTime(msg.timestamp)}</span>
                      {msg.isOutgoing && (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          {msg.status === 'delivered' ? (
                            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                          ) : (
                            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                          )}
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Mesajınızı yazın..."
            className="flex-1 px-4 py-3 bg-gray-100 rounded-full outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="w-12 h-12 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 rounded-full flex items-center justify-center text-white transition-colors"
          >
            {sending ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
