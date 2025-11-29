import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Phone, LogIn, User } from 'lucide-react';
import { useData } from '../../context/DataContext';

export const Login: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { users } = useData();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await login(phoneNumber);
    
    if (!success) {
      setError('Kullanıcı bulunamadı. Lütfen numaranızı kontrol edin.');
    }
    
    setLoading(false);
  };

  const handleDemoAdmin = () => {
      setPhoneNumber('905001112233');
  }

  const handleDemoUser = () => {
      // Find a random user from mock data
      const randomUser = users.find(u => u.role === 'user');
      if (randomUser) {
          setPhoneNumber(randomUser.phone);
      }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-8 mx-auto md:h-screen lg:py-0 bg-gray-50 dark:bg-gray-900">
      <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
        <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
          <div className="flex justify-center mb-4">
             <div className="p-3 bg-blue-100 rounded-full dark:bg-blue-900">
                <ShieldCheck className="w-10 h-10 text-blue-600 dark:text-blue-300" />
             </div>
          </div>
          <h1 className="text-xl font-bold leading-tight tracking-tight text-center text-gray-900 md:text-2xl dark:text-white">
            Giriş Yap
          </h1>
          <p className="text-sm text-center text-gray-500 dark:text-gray-400">
            Telefon numaranız ile sisteme giriş yapın.
          </p>

          <form className="space-y-4 md:space-y-6" onSubmit={handleLogin}>
              <div>
                  <label htmlFor="phone" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Telefon Numarası</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Phone className="w-5 h-5 text-gray-500" />
                    </div>
                    <input 
                        type="tel" 
                        id="phone" 
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" 
                        placeholder="905xxxxxxxxx" 
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
              </div>

              {error && (
                  <div className="p-3 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-700 dark:text-red-400" role="alert">
                    {error}
                  </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-50 flex justify-center items-center"
              >
                  {loading ? 'Giriş Yapılıyor...' : (
                      <>
                        <LogIn className="w-5 h-5 mr-2" /> Giriş Yap
                      </>
                  )}
              </button>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button type="button" onClick={handleDemoAdmin} className="text-xs text-gray-500 hover:underline">Demo Admin Doldur</button>
                  <button type="button" onClick={handleDemoUser} className="text-xs text-blue-500 hover:underline font-medium">Rastgele Kullanıcı Doldur</button>
              </div>
          </form>
        </div>
      </div>
    </div>
  );
};