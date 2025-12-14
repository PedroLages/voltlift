import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Dumbbell, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';

// Import Apple and Google logos as SVG components
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.509h3.232c1.891-1.742 2.982-4.305 2.982-7.35z" fill="#4285F4"/>
    <path d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z" fill="#34A853"/>
    <path d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9 0-.66.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59z" fill="#FBBC05"/>
    <path d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.19 5.736 7.395 3.977 10 3.977z" fill="#EA4335"/>
  </svg>
);

const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.933 15.97c-.378.865-.56 1.25-1.045 2.015-.68.107-.98 1.26-1.79 1.575-.865.335-1.655.19-2.49-.085-.79-.26-1.53-.24-2.34.015-.99.31-1.51.08-2.21-.285-.71-.37-1.26-1.44-1.71-2.135C3.558 14.355 3 11.82 3.4 9.71c.295-1.55 1.29-2.71 2.56-3.27.99-.44 1.89-.415 2.86.085.575.295.96.365 1.58.035.875-.465 1.69-.665 2.69-.35 1.195.38 2.05 1.145 2.53 2.27-2.22 1.32-1.86 4.715.535 5.615-.325.92-.74 1.72-1.22 2.475zM13.12 1c.15 1.24-.43 2.295-1.23 3.11-.885.9-2.12 1.445-3.29 1.34-.195-1.185.49-2.33 1.25-3.095C10.73 1.5 12.13 1.06 13.12 1z"/>
  </svg>
);

const Login = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, loginWithApple, register, isLoading, error } = useAuthStore();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(() => {
    // Load preference from localStorage, default to true
    const saved = localStorage.getItem('rememberMe');
    return saved === null ? true : saved === 'true';
  });

  // Get return URL from localStorage or default to '/'
  const getReturnUrl = () => {
    const returnUrl = localStorage.getItem('returnUrl');
    localStorage.removeItem('returnUrl'); // Clean up
    return returnUrl || '/';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Save rememberMe preference
    localStorage.setItem('rememberMe', rememberMe.toString());

    let success: boolean;
    if (isRegister) {
      success = await register(email, password, name, rememberMe);
    } else {
      success = await login(email, password, rememberMe);
    }

    if (success) {
      navigate(getReturnUrl());
    }
  };

  const handleGoogleLogin = async () => {
    // Save rememberMe preference
    localStorage.setItem('rememberMe', rememberMe.toString());

    const success = await loginWithGoogle(rememberMe);
    if (success) {
      navigate(getReturnUrl());
    }
  };

  const handleAppleLogin = async () => {
    // Save rememberMe preference
    localStorage.setItem('rememberMe', rememberMe.toString());

    const success = await loginWithApple(rememberMe);
    if (success) {
      navigate(getReturnUrl());
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

          {/* Remember Me Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 bg-[#111] border border-[#333] rounded text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black cursor-pointer"
            />
            <label htmlFor="rememberMe" className="text-sm text-[#888] cursor-pointer select-none">
              Keep me signed in for 30 days
            </label>
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

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#333]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-black text-[#666]">or continue with</span>
          </div>
        </div>

        {/* Social Auth Buttons - Only show on web, not on iOS */}
        {!(window as any).Capacitor && (
          <div className="space-y-3">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full bg-[#111] border border-[#333] text-white py-4 rounded-lg flex items-center justify-center gap-3 hover:bg-[#1a1a1a] transition-colors disabled:opacity-50"
            >
              <GoogleIcon />
              <span className="font-semibold">Continue with Google</span>
            </button>

            <button
              onClick={handleAppleLogin}
              disabled={isLoading}
              className="w-full bg-white text-black py-4 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <AppleIcon />
              <span className="font-semibold">Continue with Apple</span>
            </button>
          </div>
        )}

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
      </div>
    </div>
  );
};

export default Login;
