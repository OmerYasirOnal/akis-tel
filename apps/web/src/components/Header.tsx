import { useStore } from '../store';

export function Header() {
  const { userId, device, logout } = useStore();

  return (
    <header className="bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.5L17.5 8 12 11.5 6.5 8 12 4.5zm-6 5.84l5 3.12v5.04l-5-3.12v-5.04zm7 8.16v-5.04l5-3.12v5.04l-5 3.12z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold">AKISTEL</h1>
            <p className="text-xs text-white/70">Güvenli Mesajlaşma</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium">{userId}</p>
            <p className="text-xs text-white/70">
              {device?.deviceId.substring(0, 8)}...
            </p>
          </div>
          
          <button
            onClick={logout}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
          >
            Çıkış
          </button>
        </div>
      </div>
    </header>
  );
}
