import { useState } from 'react';
import { Lock, LogIn } from 'lucide-react';
import { loginAdmin, getAdminSettings } from '../store';

interface Props {
  onLogin: () => void;
}

export default function AdminLogin({ onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const settings = getAdminSettings();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginAdmin(username, password)) {
      onLogin();
    } else {
      setError('Invalid credentials');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl p-8 md:p-10 max-w-md w-full fade-in">
        <div className="text-center mb-8">
          <img src={settings.companyLogo} alt={settings.companyName} className="h-16 w-16 object-contain mx-auto mb-4 rounded-xl" />
          <h1 className="text-2xl font-bold">{settings.companyName}</h1>
          <p className="text-zinc-500 text-sm mt-1">Admin Dashboard Login</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter username"
              className="input-dark w-full px-4 py-3 rounded-xl"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              className="input-dark w-full px-4 py-3 rounded-xl"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2">
            <LogIn className="w-4 h-4" /> Sign In
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-xs text-zinc-600 hover:text-zinc-400 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" /> Return to submission form
          </a>
        </div>
      </div>
    </div>
  );
}
