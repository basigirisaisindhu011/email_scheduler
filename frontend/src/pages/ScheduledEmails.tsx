import React, { useEffect, useState } from 'react';
import { emailService } from '../services/api';
import { ScheduledEmail } from '../types';
import { Clock, Search, Ban, Calendar, ChevronLeft, ChevronRight, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export const ScheduledEmails: React.FC = () => {
  const [emails, setEmails] = useState<ScheduledEmail[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Cancellation Modal State
  const [cancelTarget, setCancelTarget] = useState<ScheduledEmail | null>(null);

  // Reschedule Modal State
  const [rescheduleTarget, setRescheduleTarget] = useState<ScheduledEmail | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduling, setRescheduling] = useState(false);

  const fetchScheduled = async () => {
    setLoading(true);
    try {
      const data = await emailService.getScheduledEmails({ page, limit: 10, search });
      setEmails(data.items);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch {
      toast.error('Failed to load scheduled emails');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduled();
  }, [page, search]);

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    try {
      await emailService.cancelEmail(cancelTarget.id);
      toast.success('Scheduled email cancelled');
      setCancelTarget(null);
      fetchScheduled();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel email');
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget) return;

    const targetIso = new Date(`${newDate}T${newTime}:00`);
    if (isNaN(targetIso.getTime()) || targetIso.getTime() <= Date.now()) {
      toast.error('Rescheduled date/time must be in the future');
      return;
    }

    setRescheduling(true);
    try {
      await emailService.rescheduleEmail(rescheduleTarget.id, targetIso.toISOString());
      toast.success('Email rescheduled successfully');
      setRescheduleTarget(null);
      fetchScheduled();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reschedule email');
    } finally {
      setRescheduling(false);
    }
  };

  const openRescheduleModal = (email: ScheduledEmail) => {
    setRescheduleTarget(email);
    const futureFive = new Date(Date.now() + 10 * 60 * 1000);
    setNewDate(futureFive.toISOString().split('T')[0]);
    setNewTime(
      `${String(futureFive.getHours()).padStart(2, '0')}:${String(futureFive.getMinutes()).padStart(2, '0')}`,
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Scheduled Emails</h1>
          <p className="text-sm text-slate-400">Total queued for transmission: {total}</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search recipient or subject..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-600 outline-none transition"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-6">Recipient</th>
                <th className="py-3.5 px-6">Subject</th>
                <th className="py-3.5 px-6">Scheduled At</th>
                <th className="py-3.5 px-6">Created At</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading scheduled queue...
                  </td>
                </tr>
              ) : emails.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No scheduled emails found matching your criteria.
                  </td>
                </tr>
              ) : (
                emails.map((email) => (
                  <tr key={email.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-4 px-6 font-semibold text-white">{email.recipient}</td>
                    <td className="py-4 px-6 max-w-xs truncate">{email.subject}</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(email.scheduledAt).toLocaleString()}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400 text-xs">
                      {new Date(email.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300">
                        {email.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => openRescheduleModal(email)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg text-xs font-medium border border-slate-700 transition"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => setCancelTarget(email)}
                        className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-medium transition"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 text-sm">
            <span className="text-slate-400">
              Page <strong className="text-white">{page}</strong> of{' '}
              <strong className="text-white">{totalPages}</strong>
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between text-rose-400 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 font-bold text-lg">
                <AlertTriangle className="w-5 h-5" />
                <span>Cancel Scheduled Email</span>
              </div>
              <button onClick={() => setCancelTarget(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-300">
              Are you sure you want to cancel the scheduled email to{' '}
              <strong className="text-white">{cancelTarget.recipient}</strong>?
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setCancelTarget(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition"
              >
                Keep Scheduled
              </button>
              <button
                onClick={handleCancelConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-rose-600/30"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between text-indigo-400 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 font-bold text-lg">
                <Calendar className="w-5 h-5" />
                <span>Reschedule Email</span>
              </div>
              <button onClick={() => setRescheduleTarget(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  New Date
                </label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  New Time
                </label>
                <input
                  type="time"
                  required
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRescheduleTarget(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rescheduling}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-600/30"
                >
                  {rescheduling ? 'Saving...' : 'Update Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
