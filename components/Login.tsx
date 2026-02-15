
import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { supabase } from '../services/supabase';

interface LoginProps {
  onLogin: (email: string, pass: string) => Promise<void>;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        });
        if (signUpError) throw signUpError;
        // Supabase often sends a confirmation email, but we'll try to login or show a message
        setError("Registration successful! Please check your email for confirmation (if enabled) or try logging in.");
        setIsRegistering(false);
      } else {
        await onLogin(email, password);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 bg-slate-50/50">
      <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-12">
          <div className="text-6xl mx-auto mb-6 soft-bounce">
            🏠
          </div>
          <h1 className="text-4xl font-[900] text-slate-900 tracking-tighter mb-2">
            {isRegistering ? 'Create Account' : 'Welcome'}
          </h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
            {isRegistering ? 'Join your family pantry' : 'Manage your pantries together'}
          </p>
        </div>

        {error && (
          <div className={`mb-6 p-4 rounded-2xl text-[11px] font-black uppercase tracking-wider text-center ${error.includes("successful") ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
            }`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <Input
              label="Full Name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Sarah Miller"
            />
          )}

          <Input
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hello@pantry.com"
          />

          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          <div className="pt-4">
            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full py-5 rounded-[2rem] text-sm uppercase tracking-widest"
            >
              {isRegistering ? 'Create Account' : 'Sign In'}
            </Button>
          </div>
        </form>

        <div className="mt-8 text-center space-y-6">
          {!isRegistering && (
            <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition-colors">
              Forgot password?
            </button>
          )}

          <div className="pt-8 border-t border-slate-100">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">
              {isRegistering ? 'Already have an account?' : 'New to SharedPantry?'}
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
              }}
              className="w-full py-4 border-2 border-emerald-500/20 text-emerald-600 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-emerald-50"
            >
              {isRegistering ? 'Back to Login' : 'Create Family Account'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
