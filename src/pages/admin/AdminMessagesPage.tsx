/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/pages/admin/AdminMessagesPage.tsx
 * Purpose: Admin inbox for viewing, marking read/unread, and deleting contact form inquiries.
 */

import React from 'react';
import { Check, Trash2 } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import {
  deleteMessage,
  getAllMessagesAdmin,
  markMessageRead,
} from '../../services/contactService';
import { useSite } from '../../context/SiteContext';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';
import { formatDate } from '../../utils/helpers';

export default function AdminMessagesPage() {
  const { showToast } = useSite();
  const { data: messages, loading, refetch } = useFirestore(() => getAllMessagesAdmin(100), []);

  const handleToggleRead = async (id: string, currentRead: boolean) => {
    try {
      await markMessageRead(id, !currentRead);
      showToast(!currentRead ? 'Marked as read.' : 'Marked as unread.');
      await refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Update failed.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this inquiry?')) return;
    try {
      await deleteMessage(id);
      showToast('Message deleted.');
      await refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl font-extrabold uppercase text-white">
          Messages Inbox
        </h1>
        <p className="text-sm text-neutral-400">
          Review inbound contact form inquiries from prospective and current members.
        </p>
      </div>

      {loading ? (
        <Loader label="Loading inbox..." />
      ) : messages.length === 0 ? (
        <div className="p-10 text-center rounded-lg bg-[#14171A] border border-white/10 text-neutral-400">
          No contact inquiries yet.
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-5 rounded-lg border space-y-3 ${
                msg.read
                  ? 'bg-[#14171A] border-white/10'
                  : 'bg-[#181C20] border-[var(--accent)]/60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-[var(--accent)] font-semibold uppercase">
                    {msg.read ? 'Read' : 'Unread'} &middot; {formatDate(msg.createdAt)}
                  </p>
                  <h2 className="font-display text-2xl font-bold uppercase text-white">
                    {msg.subject}
                  </h2>
                  <p className="text-xs text-neutral-400">
                    From: {msg.name} ({msg.email}
                    {msg.phone ? ` · ${msg.phone}` : ''})
                  </p>
                </div>

                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleToggleRead(msg.id, msg.read)}
                  >
                    <Check size={14} />
                    <span>{msg.read ? 'Mark Unread' : 'Mark Read'}</span>
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(msg.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>

              <p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-line">
                {msg.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
