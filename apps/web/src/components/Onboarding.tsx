import { useState } from 'react';
import { useStore } from '../store';
import { hashUserId } from '../lib/crypto';

export function Onboarding() {
  const [step, setStep] = useState<'welcome' | 'register'>('welcome');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register } = useStore();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Telefon numarasından userId oluştur (hash)
      const userId = hashUserId(phone.replace(/\s/g, ''));
      await register(userId, name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-akis-dark via-akis-darker to-akis-accent flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {step === 'welcome' ? (
          <div className="text-center">
            {/* Logo */}
            <div className="w-24 h-24 mx-auto mb-6 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur">
              <svg className="w-14 h-14 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.5L17.5 8 12 11.5 6.5 8 12 4.5zm-6 5.84l5 3.12v5.04l-5-3.12v-5.04zm7 8.16v-5.04l5-3.12v5.04l-5 3.12z"/>
              </svg>
            </div>

            <h1 className="text-4xl font-bold text-white mb-2">AKISTEL</h1>
            <p className="text-lg text-white/70 mb-8">Güvenli Mesajlaşma</p>

            {/* Özellikler */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-white/80">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <span>Uçtan uca şifreleme</span>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span>Sunucu mesaj içeriğini görmez</span>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span>Hızlı ve güvenilir</span>
              </div>
            </div>

            <button
              onClick={() => setStep('register')}
              className="w-full py-4 bg-akis-highlight hover:bg-red-500 text-white font-semibold rounded-xl transition-colors"
            >
              Başla
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <button
              onClick={() => setStep('welcome')}
              className="mb-4 text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Geri
            </button>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">Hesap Oluştur</h2>
            <p className="text-gray-500 mb-6">Bilgileriniz cihazınızda güvenle saklanır</p>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon Numarası
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+90 5XX XXX XX XX"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adınız
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Adınızı girin"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !phone.trim() || !name.trim()}
                className="w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Kaydediliyor...
                  </span>
                ) : (
                  'Kayıt Ol'
                )}
              </button>
            </form>

            <p className="mt-6 text-xs text-gray-400 text-center">
              Kayıt olarak, şifreleme anahtarları cihazınızda oluşturulur.<br/>
              Sunucumuz mesaj içeriklerinize erişemez.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
