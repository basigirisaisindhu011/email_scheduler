import React, { useState } from 'react';
import { getApiBaseUrl, setApiBaseUrl } from '../services/api';
import { Server, Check, X, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const ApiConfigModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState(getApiBaseUrl());
  const [testing, setTesting] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setApiBaseUrl(url);
    toast.success('API endpoint updated!');
    onClose();
    window.location.reload();
  };

  const handleReset = () => {
    localStorage.removeItem('custom_api_url');
    setUrl(import.meta.env.VITE_API_URL || 'http://localhost:5000/api');
    toast.info('API endpoint reset to default');
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const clean = url.trim().replace(/\/$/, '');
      const testUrl = clean.endsWith('/api') ? `${clean.replace(/\/api$/, '')}/health` : `${clean}/health`;
      const res = await fetch(testUrl);
      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        toast.success(`Connected! Database: ${data.database}, Redis: ${data.redis}`);
      } else {
        toast.warning('Server responded but health check failed.');
      }
    } catch {
      toast.error('Failed to connect to the specified API URL.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between text-indigo-400 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 font-bold text-lg">
            <Server className="w-5 h-5" />
            <span>Backend API Configuration</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Configure the backend API endpoint URL for registration, login, and email queue management.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Backend API URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-backend.onrender.com/api"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="flex items-center space-x-1 text-xs text-indigo-400 hover:underline"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>Test Connection</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-500 hover:text-slate-300 underline"
            >
              Reset to Default
            </button>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-indigo-600/30"
          >
            Save & Reload
          </button>
        </div>
      </div>
    </div>
  );
};
