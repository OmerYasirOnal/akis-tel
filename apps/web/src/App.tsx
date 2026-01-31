import { useEffect, useState } from 'react';
import { useStore } from './store';
import { Onboarding } from './components/Onboarding';
import { ChatList } from './components/ChatList';
import { ChatView } from './components/ChatView';
import { Header } from './components/Header';

function App() {
  const { device, initialized, initialize } = useStore();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-akis-dark to-akis-darker">
        <div className="text-white text-xl">Yükleniyor...</div>
      </div>
    );
  }

  if (!device) {
    return <Onboarding />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        {/* Sol panel - Sohbet listesi */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <ChatList 
            selectedUserId={selectedUserId}
            onSelectUser={setSelectedUserId}
          />
        </div>
        
        {/* Sağ panel - Sohbet görünümü */}
        <div className="flex-1 flex flex-col">
          {selectedUserId ? (
            <ChatView userId={selectedUserId} />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center text-gray-500">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-lg">Sohbet başlatmak için sol panelden bir kişi seçin</p>
                <p className="text-sm mt-2">veya yeni bir sohbet başlatın</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
