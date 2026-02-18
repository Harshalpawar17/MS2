
import React, { useState } from 'react';
import { MOCK_CREDENTIALS } from '../constants';
import { User } from '../types';
import { Lock, Mail, ChevronRight } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = MOCK_CREDENTIALS.find(c => c.email === email && c.password === password);
    if (found) {
      onLogin({ email: found.email, role: found.role, name: found.name });
    } else {
      setError('Invalid credentials.');
    }
  };

  const handleFastLogin = (creds: typeof MOCK_CREDENTIALS[0]) => {
    setEmail(creds.email);
    setPassword(creds.password);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <img 
            src="sage_healthy_rcm_logo.png" 
            alt="MySage" 
            className="h-28 mx-auto mb-4 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://placehold.co/400x120/ffffff/6D6E71?text=MySage";
            }}
          />
        </div>

        <div className="bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-10 border border-gray-100">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-secondary uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium text-primaryText"
                  placeholder="name@mysage.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-secondary uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium text-primaryText"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && <p className="text-red-600 bg-red-50 p-3 rounded-xl text-xs font-bold text-center border border-red-100">{error}</p>}

            <button
              type="submit"
              className="w-full py-4 bg-primary hover:opacity-95 text-white font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center space-x-2"
            >
              <span>Login</span>
              <ChevronRight size={20} />
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-100">
            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-4 text-center">Development Roles</p>
            <div className="grid grid-cols-2 gap-2">
              {MOCK_CREDENTIALS.map((creds) => (
                <button
                  key={creds.role}
                  onClick={() => handleFastLogin(creds)}
                  className="text-center p-2.5 bg-gray-50 hover:bg-primary/5 rounded-xl text-[10px] font-bold text-secondary border border-gray-100 hover:border-primary/20 transition-colors"
                >
                  {creds.role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
