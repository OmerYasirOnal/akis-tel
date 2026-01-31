import { useState } from 'react';
import { useStore } from '../store';

interface ChatListProps {
  selectedUserId: string | null;
  onSelectUser: (userId: string) => void;
}

export function ChatList({ selectedUserId, onSelectUser }: ChatListProps) {
  const { chats, contacts, addContact, userId: currentUserId } = useStore();
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactId, setNewContactId] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatList = Array.from(chats.values())
    .filter(chat => chat.odildi !== currentUserId)
    .sort((a, b) => {
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactId.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await addContact(newContactId.trim(), newContactName.trim() || newContactId.trim());
      setNewContactId('');
      setNewContactName('');
      setShowAddContact(false);
      onSelectUser(newContactId.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kişi eklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string | undefined) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 86400000) { // 24 saat
      return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Sohbetler</h2>
          <button
            onClick={() => setShowAddContact(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Yeni sohbet"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddContact && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <form onSubmit={handleAddContact} className="space-y-3">
            <input
              type="text"
              value={newContactId}
              onChange={(e) => setNewContactId(e.target.value)}
              placeholder="Kullanıcı ID'si"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              autoFocus
            />
            <input
              type="text"
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              placeholder="İsim (opsiyonel)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
            {error && (
              <p className="text-red-500 text-xs">{error}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddContact(false)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading || !newContactId.trim()}
                className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:bg-gray-300"
              >
                {loading ? '...' : 'Ekle'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chatList.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-3">💬</div>
            <p>Henüz sohbet yok</p>
            <p className="text-sm mt-1">Yeni bir sohbet başlatın</p>
          </div>
        ) : (
          chatList.map((chat) => {
            const contact = contacts.get(chat.odildi);
            const isSelected = selectedUserId === chat.odildi;
            
            return (
              <div
                key={chat.odildi}
                onClick={() => onSelectUser(chat.odildi)}
                className={`flex items-center gap-3 p-4 cursor-pointer border-b border-gray-100 transition-colors ${
                  isSelected ? 'bg-primary-50' : 'hover:bg-gray-50'
                }`}
              >
                {/* Avatar */}
                <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {(contact?.name || chat.odildi)[0].toUpperCase()}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-800 truncate">
                      {contact?.name || chat.odildi.substring(0, 12)}
                    </h3>
                    <span className="text-xs text-gray-400 ml-2">
                      {formatTime(chat.lastMessageTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-sm text-gray-500 truncate">
                      {chat.lastMessage || 'Sohbet başlat...'}
                    </p>
                    {chat.unreadCount > 0 && (
                      <span className="ml-2 w-5 h-5 bg-primary-600 rounded-full text-white text-xs flex items-center justify-center">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
