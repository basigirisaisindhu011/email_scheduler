import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { emailService } from '../services/api';
import { DashboardStats, ScheduledEmail } from '../types';
import { Clock, CheckCircle2, XCircle, Ban, Plus, RefreshCw, Mail } from 'lucide-react';
import { toast } from 'sonner';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({ scheduled: 0, sent: 0, failed: 0, cancelled: 0 });
  const [recentScheduled, setRecentScheduled] = useState<ScheduledEmail[]>([]);
  const [recentSent, setRecentSent] = useState<ScheduledEmail[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, scheduledRes, sentRes] = await Promise.all([
        emailService.getStats(),
        emailService.getScheduledEmails({ limit: 5 }),
        emailService.getSentEmails({ limit: 5 }),
      ]);
      setStats(statsRes);
      setRecentScheduled(scheduledRes.items);
      setRecentSent(sentRes.items);
    } catch {
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Email Operations Dashboard</h1>
          <p className="text-sm text-slate-400">Real-time persistence and delayed queue overview</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium py-2 px-3.5 rounded-xl border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/compose"
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold py-2 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Email</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Scheduled Card */}
        <div className="bg-slate-950 border border-amber-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">Scheduled</p>
              <h2 className="text-3xl font-extrabold text-white mt-1">{stats.scheduled}</h2>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">Queued in BullMQ Redis memory</p>
        </div>

        {/* Sent Card */}
        <div className="bg-slate-950 border border-emerald-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Sent</p>
              <h2 className="text-3xl font-extrabold text-white mt-1">{stats.sent}</h2>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">Delivered via Nodemailer SMTP</p>
        </div>

        {/* Failed Card */}
        <div className="bg-slate-950 border border-rose-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-400">Failed</p>
              <h2 className="text-3xl font-extrabold text-white mt-1">{stats.failed}</h2>
            </div>
            <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
              <XCircle className="w-6 h-6 text-rose-400" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">Exhausted exponential retries</p>
        </div>

        {/* Cancelled Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cancelled</p>
              <h2 className="text-3xl font-extrabold text-white mt-1">{stats.cancelled}</h2>
            </div>
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
              <Ban className="w-6 h-6 text-slate-400" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">Aborted prior to worker pick up</p>
        </div>
      </div>

      {/* Content Section: Recent Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Scheduled */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-lg text-white">Upcoming Scheduled Emails</h3>
            </div>
            <Link to="/scheduled" className="text-xs font-semibold text-indigo-400 hover:underline">
              View All
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-500 text-sm">Loading queue data...</div>
          ) : recentScheduled.length === 0 ? (
            <div className="py-8 text-center text-slate-500 space-y-2">
              <Mail className="w-8 h-8 text-slate-700 mx-auto" />
              <p className="text-sm">No emails currently scheduled</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {recentScheduled.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between text-sm">
                  <div className="min-w-0 pr-4">
                    <p className="font-semibold text-white truncate">{item.recipient}</p>
                    <p className="text-xs text-slate-400 truncate">{item.subject}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {new Date(item.scheduledAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sent */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-lg text-white">Recently Delivered Emails</h3>
            </div>
            <Link to="/sent" className="text-xs font-semibold text-indigo-400 hover:underline">
              View All
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-500 text-sm">Loading sent log...</div>
          ) : recentSent.length === 0 ? (
            <div className="py-8 text-center text-slate-500 space-y-2">
              <Mail className="w-8 h-8 text-slate-700 mx-auto" />
              <p className="text-sm">No delivered emails yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {recentSent.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between text-sm">
                  <div className="min-w-0 pr-4">
                    <p className="font-semibold text-white truncate">{item.recipient}</p>
                    <p className="text-xs text-slate-400 truncate">{item.subject}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {item.sentAt ? new Date(item.sentAt).toLocaleTimeString() : 'Delivered'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
