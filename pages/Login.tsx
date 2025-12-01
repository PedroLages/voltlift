import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Dumbbell, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login, register, isLoading, error } = useAuthStore();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let success: boolean;
    if (isRegister) {
      success = await register(email, password, name);
    } else {
      success = await login(email, password);
    }

    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-12">
        <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
          <Dumbbell className="text-black" size={28} />
        </div>
        <span className="text-3xl font-black italic tracking-tighter text-white">
          IRON<span className="text-primary">PATH</span>
        </span>
      </div>

      {/* Form Card */}
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-black italic text-white mb-2">
          {isRegister ? 'CREATE ACCOUNT' : 'WELCOME BACK'}
        </h1>
        <p className="text-[#888] mb-8">
          {isRegister ? 'Start your journey' : 'Continue your grind'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666]" size={20} />
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#111] border border-[#333] rounded-lg py-4 pl-12 pr-4 text-white placeholder:text-[#666] focus:outline-none focus:border-primary transition-colors"
                required
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666]" size={20} />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#111] border border-[#333] rounded-lg py-4 pl-12 pr-4 text-white placeholder:text-[#666] focus:outline-none focus:border-primary transition-colors"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666]" size={20} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#111] border border-[#333] rounded-lg py-4 pl-12 pr-4 text-white placeholder:text-[#666] focus:outline-none focus:border-primary transition-colors"
              required
              minLength={8}
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-black font-black italic py-4 rounded-lg flex items-center justify-center gap-2 hover:bg-[#b8e600] transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                {isRegister ? 'CREATE ACCOUNT' : 'SIGN IN'}
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-[#888] hover:text-white transition-colors"
          >
            {isRegister ? (
              <>Already have an account? <span className="text-primary">Sign in</span></>
            ) : (
              <>Don't have an account? <span className="text-primary">Sign up</span></>
            )}
          </button>
        </div>

        {/* Skip for now (offline mode) */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/welcome')}
            className="text-[#666] text-sm hover:text-[#888] transition-colors"
          >
            Continue offline →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
