import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiConfigModal } from '../components/ApiConfigModal';
import { Mail, Lock, LogIn, AlertCircle, Server } from 'lucide-react';
import { toast } from 'sonner';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiModalOpen, setApiModalOpen] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: any) {
      let msg = 'Login failed. Please check your credentials.';
      if (err.response?.data) {
        const data = err.response.data;
        if (data.message) {
          msg = data.message;
        } else if (data.errors?.fieldErrors) {
          const fieldErrors = data.errors.fieldErrors;
          const firstField = Object.keys(fieldErrors)[0];
          if (firstField && fieldErrors[firstField]?.length > 0) {
            msg = `${firstField}: ${fieldErrors[firstField][0]}`;
          }
        }
      } else if (err.customMessage) {
        msg = err.customMessage;
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-2xl shadow-lg shadow-indigo-500/20 mb-2">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sign in to Outbox</h1>
          <p className="text-sm text-slate-400">Manage and schedule your persistent email queues</p>
        </div>

        {error && (
          <div className="flex items-center space-x-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-800 flex items-center justify-between">
          <span>
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:underline font-medium">
              Create one
            </Link>
          </span>
          <button
            type="button"
            onClick={() => setApiModalOpen(true)}
            className="flex items-center space-x-1 text-slate-400 hover:text-indigo-400 underline"
          >
            <Server className="w-3 h-3" />
            <span>API Settings</span>
          </button>
        </div>
      </div>
      <ApiConfigModal isOpen={apiModalOpen} onClose={() => setApiModalOpen(false)} />
    </div>
  );
};
