import React, { useEffect, useState } from 'react';
import { emailService } from '../services/api';
import { ScheduledEmail } from '../types';
import { XCircle, Search, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const FailedEmails: React.FC = () => {
  const [emails, setEmails] = useState<ScheduledEmail[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchFailed = async () => {
    setLoading(true);
    try {
      const data = await emailService.getFailedEmails({ page, limit: 10, search });
      setEmails(data.items);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch {
      toast.error('Failed to load failed email logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFailed();
  }, [page, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Failed Email Executions</h1>
          <p className="text-sm text-slate-400">Total failed attempts: {total}</p>
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
                <th className="py-3.5 px-6">Scheduled Time</th>
                <th className="py-3.5 px-6">Failure Reason</th>
                <th className="py-3.5 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    Loading failed execution logs...
                  </td>
                </tr>
              ) : emails.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No failed emails recorded.
                  </td>
                </tr>
              ) : (
                emails.map((email) => (
                  <tr key={email.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-4 px-6 font-semibold text-white">{email.recipient}</td>
                    <td className="py-4 px-6 max-w-xs truncate">{email.subject}</td>
                    <td className="py-4 px-6 text-slate-400 text-xs">
                      {new Date(email.scheduledAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 max-w-sm">
                      <div className="flex items-center space-x-2 text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{email.failureReason || 'Exhausted retry attempts'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>FAILED</span>
                      </span>
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
    </div>
  );
};
