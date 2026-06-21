import React, { useState } from 'react';
import { useUser } from './UserContext';
import { LogIn, UserPlus, KeyRound, AlertCircle, ShoppingBag } from 'lucide-react';

export default function AuthView() {
  const { login } = useUser();
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [requiresPin, setRequiresPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await login(name, requiresPin ? pin : undefined);
      
      if (!result.success) {
        if (result.requiresPin) {
          setRequiresPin(true);
          setError(null);
        } else {
          setError(result.error || 'Failed to authenticate.');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToUsername = () => {
    setRequiresPin(false);
    setPin('');
    setError(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-neutral-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/20 ring-1 ring-white/10 animate-pulse">
            <ShoppingBag className="h-8 w-8 text-slate-950" />
          </div>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            ShelfLife
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-xs">
            Shared kitchen inventory tracking for 3–6 housemates
          </p>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-8 shadow-2xl ring-1 ring-white/5">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && !requiresPin && (
              <div className="flex items-start gap-3 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-300">
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-450" />
                <p>{error}</p>
              </div>
            )}

            {!requiresPin ? (
              <div className="space-y-2">
                <label htmlFor="display-name" className="block text-sm font-semibold text-slate-300">
                  What should we call you?
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <UserPlus className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    id="display-name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name (e.g. Alice)"
                    disabled={loading}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950/60 py-3 pl-11 pr-4 text-slate-200 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 text-sm transition-all"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Use your actual name. If it's your first time, we will create your profile and generate a PIN for you.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-sm text-amber-300">
                  <KeyRound className="h-5 w-5 shrink-0 text-amber-400" />
                  <div>
                    <p className="font-medium">Enter your PIN</p>
                    <p className="mt-1 text-xs text-amber-400/80">
                      The name &quot;<span className="font-semibold text-white">{name}</span>&quot; is already registered. Please enter its associated 6-digit PIN.
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-3 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-300">
                    <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
                    <p>{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <input
                    id="pin"
                    name="pin"
                    type="text"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit PIN"
                    disabled={loading}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950/60 py-3 text-center tracking-widest text-lg font-bold text-white placeholder-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 transition-all"
                  />
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500 px-1">
                  <span>Ask a housemate if you forgot it.</span>
                  <button
                    type="button"
                    onClick={handleBackToUsername}
                    className="font-medium text-emerald-400 hover:text-emerald-300 hover:underline transition-colors"
                  >
                    Change name
                  </button>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 py-3 px-4 text-sm font-bold text-slate-950 hover:from-emerald-400 hover:to-teal-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-500/10 transition-all duration-200"
              >
                {loading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                ) : requiresPin ? (
                  <span className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" /> Verify & Login
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" /> Continue
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
