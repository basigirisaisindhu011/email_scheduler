import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { emailService } from '../services/api';
import { Send, Calendar, Clock, Mail, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const ComposeEmail: React.FC = () => {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  // Default date to today, default time to 5 mins in future
  const now = new Date();
  const defaultDateStr = now.toISOString().split('T')[0];
  const futureFive = new Date(now.getTime() + 5 * 60 * 1000);
  const defaultTimeStr = `${String(futureFive.getHours()).padStart(2, '0')}:${String(
    futureFive.getMinutes(),
  ).padStart(2, '0')}`;

  const [scheduledDate, setScheduledDate] = useState(defaultDateStr);
  const [scheduledTime, setScheduledTime] = useState(defaultTimeStr);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const targetIso = new Date(`${scheduledDate}T${scheduledTime}:00`);
    if (isNaN(targetIso.getTime())) {
      setError('Please select a valid scheduled date and time.');
      return;
    }

    if (targetIso.getTime() <= Date.now()) {
      setError('Scheduled time must be in the future.');
      toast.error('Scheduled time must be in the future');
      return;
    }

    setIsSubmitting(true);

    try {
      await emailService.scheduleEmail({
        recipient,
        subject,
        body,
        scheduledAt: targetIso.toISOString(),
      });

      toast.success('Email scheduled successfully!');
      navigate('/scheduled');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to schedule email. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Compose Scheduled Email</h1>
        <p className="text-sm text-slate-400">
          Create and queue an email for delayed execution with BullMQ and Ethereal SMTP
        </p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl">
        {error && (
          <div className="flex items-center space-x-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-sm mb-6">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Recipient */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Recipient Email
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition"
              />
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Email Subject
            </label>
            <div className="relative">
              <FileText className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Outbox Labs Technical Assessment - Submission"
                className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition"
              />
            </div>
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Email Body
            </label>
            <textarea
              required
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email content here..."
              className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl p-4 text-sm text-white placeholder-slate-600 outline-none transition resize-y"
            />
          </div>

          {/* Date & Time Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Scheduled Date
              </label>
              <div className="relative">
                <Calendar className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Scheduled Time
              </label>
              <div className="relative">
                <Clock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="time"
                  required
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Schedule Email</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
